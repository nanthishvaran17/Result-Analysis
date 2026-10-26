import io
import csv
import re
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.student import Department, Student
from app.models.session import ExamSession
from app.models.subject import Subject
from app.models.result import StudentResult, SubjectResult
from app.services.pdf_service import generate_marksheet_pdf, verify_and_store_pdf

COE_PORTAL_URL = "https://coe.nandhaengg.org/results/result.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://coe.nandhaengg.org/results/"
}

GRADE_POINTS: Dict[str, float] = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C+": 6.5,
    "C": 5.0,
    "RA": 0.0,
    "U": 0.0,
    "SA": 0.0,
    "W": 0.0,
    "WD": 0.0,
    "AB": 0.0,
    "VG": 0.0,  # Non credit
    "G": 0.0,   # Non credit
    "SF": 0.0   # Non credit
}

PASSING_GRADES = {"O", "A+", "A", "B+", "B", "C+", "C", "VG", "G", "SF"}
NON_CREDIT_GRADES = {"VG", "G", "SF"}

def fetch_live_coe_result(register_number: str, dob: str) -> Dict[str, Any]:
    """
    Submits student credentials to Nandha Engineering College COE portal
    and parses the live response.
    """
    clean_reg = register_number.strip().upper()
    # Ensure DOB is formatted as DD/MM/YYYY
    dob_clean = dob.strip().replace("-", "/")
    parts = [p.strip() for p in dob_clean.split("/") if p.strip()]
    if len(parts) == 3:
        day = parts[0].zfill(2)
        month = parts[1].zfill(2)
        year = parts[2]
        dob_formatted = f"{day}/{month}/{year}"
    else:
        dob_formatted = dob_clean

    session = requests.Session()
    resp = session.post(
        COE_PORTAL_URL,
        data={
            "registernumber": clean_reg,
            "dob": dob_formatted
        },
        headers=HEADERS,
        timeout=15
    )

    if resp.status_code != 200:
        raise ValueError(f"COE Portal responded with status code: {resp.status_code}")

    html = resp.text
    if "Student Login" in html and "View Result" in html and "student_data" not in html and "result-table" not in html:
        raise ValueError("Invalid Register Number or Date of Birth on Nandha COE portal.")

    soup = BeautifulSoup(html, "html.parser")

    # Extract Student Header Details
    student_name = ""
    branch_name = ""
    year_of_passing = ""

    for h3 in soup.find_all(["h3", "h4", "p", "div"]):
        txt = h3.get_text().strip()
        if "Name :" in txt:
            # Look at sibling or inside
            val = txt.replace("Name :", "").strip()
            if val:
                student_name = val
        elif "Branch :" in txt:
            val = txt.replace("Branch :", "").strip()
            if val:
                branch_name = val
        elif "Year Of Passing :" in txt:
            val = txt.replace("Year Of Passing :", "").strip()
            if val:
                year_of_passing = val

    # Fallback search in stu_name / stu_reg containers
    stu_name_divs = soup.find_all("div", class_="stu_name")
    for div in stu_name_divs:
        full_text = div.get_text()
        if "Name :" in full_text and not student_name:
            lines = [l.strip() for l in full_text.splitlines() if l.strip()]
            for idx, line in enumerate(lines):
                if line == "Name :" and idx + 1 < len(lines):
                    student_name = lines[idx + 1]
                if line == "Branch :" and idx + 1 < len(lines):
                    branch_name = lines[idx + 1]
                if line == "Year Of Passing :" and idx + 1 < len(lines):
                    year_of_passing = lines[idx + 1]

    if not student_name:
        # Generic fallback if pattern differs
        h4_tags = [h.get_text().strip() for h in soup.find_all("h4")]
        if len(h4_tags) >= 2:
            student_name = h4_tags[1]

    # Parse Subject Result Table
    # The first table with class result-table
    tables = soup.find_all("table")
    course_table = None
    for tbl in tables:
        tbl_text = tbl.get_text()
        if "COURSE CODE" in tbl_text and "GRADE" in tbl_text:
            course_table = tbl
            break

    if not course_table:
        raise ValueError("Could not locate course results table in the portal response.")

    rows = course_table.find_all("tr")
    courses = []

    for row in rows:
        cols = [td.get_text().strip() for td in row.find_all(["td", "th"])]
        if not cols or len(cols) < 4:
            continue
        code, name, grade, result = cols[0], cols[1], cols[2], cols[3]
        if code == "COURSE CODE" or not code:
            continue

        # Standardize Grade
        grade_clean = grade.upper().strip()
        result_clean = result.upper().strip()
        if not result_clean:
            result_clean = "PASS" if grade_clean in PASSING_GRADES else "RA"

        # Determine credits based on course type
        # Non-credit courses have grade VG, G, SF
        if grade_clean in NON_CREDIT_GRADES or "LABORATORY" in name.upper() and "II" in name.upper():
            if grade_clean in NON_CREDIT_GRADES:
                credits = 0
            else:
                credits = 2
        elif "LABORATORY" in name.upper() or "LAB" in name.upper():
            credits = 2
        elif "PROJECT" in name.upper() or "ASSESSMENT" in name.upper():
            credits = 2
        else:
            credits = 3

        courses.append({
            "code": code,
            "name": name,
            "grade": grade_clean,
            "result": result_clean,
            "credits": credits
        })

    if not courses:
        raise ValueError("No course records extracted from the portal.")

    # Calculate GPA & credits
    total_credits = 0
    earned_credits = 0
    weighted_pts = 0.0
    arrears_count = 0

    for c in courses:
        cr = c["credits"]
        gr = c["grade"]
        if cr > 0:
            total_credits += cr
            if gr in PASSING_GRADES:
                earned_credits += cr
                weighted_pts += (GRADE_POINTS.get(gr, 0.0) * cr)
            else:
                arrears_count += 1
        else:
            # Non-credit course
            if gr not in PASSING_GRADES:
                arrears_count += 1

    sgpa = round(weighted_pts / total_credits, 2) if total_credits > 0 else 0.0
    overall_status = "PASS" if arrears_count == 0 else "FAIL"

    return {
        "register_number": clean_reg,
        "student_name": student_name or f"Student {clean_reg}",
        "branch_name": branch_name or "Computer Science and Engineering",
        "year_of_passing": year_of_passing,
        "dob": dob_formatted,
        "courses": courses,
        "total_credits": total_credits,
        "earned_credits": earned_credits,
        "gpa": sgpa,
        "arrears_count": arrears_count,
        "result_status": overall_status
    }

def import_or_update_live_result(
    db: Session,
    live_data: Dict[str, Any],
    session_id: int
) -> StudentResult:
    """
    Saves the fetched live Nandha COE result into the database,
    synchronizing department, student, subjects, and generates authentic marksheet PDF.
    """
    reg_no = live_data["register_number"]
    branch = live_data["branch_name"]
    name = live_data["student_name"]
    dob = live_data["dob"]

    # Determine department code
    # e.g., 'B.E - COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY)' -> 'CSE-CS'
    if "CYBER" in branch.upper():
        dept_code = "CSE-CS"
        dept_name = "Computer Science and Engineering (Cyber Security)"
    elif "COMPUTER SCIENCE" in branch.upper():
        dept_code = "CSE"
        dept_name = "Computer Science and Engineering"
    elif "INFORMATION TECHNOLOGY" in branch.upper():
        dept_code = "IT"
        dept_name = "Information Technology"
    elif "COMMUNICATION" in branch.upper():
        dept_code = "ECE"
        dept_name = "Electronics and Communication Engineering"
    elif "MECHANICAL" in branch.upper():
        dept_code = "MECH"
        dept_name = "Mechanical Engineering"
    else:
        dept_code = "ENGG"
        dept_name = branch

    # 1. Ensure Department
    dept = db.query(Department).filter(Department.code == dept_code).first()
    if not dept:
        dept = Department(code=dept_code, name=dept_name)
        db.add(dept)
        db.commit()
        db.refresh(dept)

    # 2. Ensure Student
    student = db.query(Student).filter(Student.register_number == reg_no).first()
    if not student:
        student = Student(
            register_number=reg_no,
            name=name,
            department_code=dept_code,
            batch="2022-2026",
            current_semester=6,
            section="A",
            dob=dob,
            email=f"{reg_no.lower()}@nandhaengg.org",
            is_active=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student.name = name
        student.department_code = dept_code
        student.dob = dob
        db.commit()

    # 3. Ensure Exam Session
    exam_session = db.query(ExamSession).filter(ExamSession.id == session_id).first() if session_id else None
    if not exam_session:
        exam_session = db.query(ExamSession).filter(ExamSession.is_active == True).first()
    if not exam_session:
        exam_session = db.query(ExamSession).order_by(ExamSession.id.desc()).first()
    if not exam_session:
        exam_session = ExamSession(
            session_code="NOV_DEC_2025",
            academic_year="2025-2026",
            semester_type="ODD",
            is_active=True
        )
        db.add(exam_session)
        db.commit()
        db.refresh(exam_session)

    # 4. Ensure Subjects exist in master table & cache by code
    subject_map = {}
    for c in live_data["courses"]:
        sub = db.query(Subject).filter(Subject.code == c["code"]).first()
        if not sub:
            sub = Subject(
                code=c["code"],
                name=c["name"],
                department_code=dept_code,
                semester=student.current_semester,
                credits=c["credits"]
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)
        subject_map[c["code"]] = sub

    # 5. Create or Update StudentResult
    existing_res = db.query(StudentResult).filter(
        StudentResult.student_id == student.id,
        StudentResult.session_id == exam_session.id,
        StudentResult.semester == student.current_semester
    ).first()

    if existing_res:
        existing_res.total_credits = live_data["total_credits"]
        existing_res.earned_credits = live_data["earned_credits"]
        existing_res.gpa = live_data["gpa"]
        existing_res.result_status = live_data["result_status"]
        existing_res.arrears_count = live_data["arrears_count"]
        existing_res.standing_arrears_count = live_data["arrears_count"]
        existing_res.is_verified = True
        existing_res.verified_at = datetime.now(timezone.utc)
        student_res = existing_res

        # Clear old subject results
        db.query(SubjectResult).filter(SubjectResult.student_result_id == student_res.id).delete()
        db.commit()
    else:
        student_res = StudentResult(
            student_id=student.id,
            session_id=exam_session.id,
            semester=student.current_semester,
            total_credits=live_data["total_credits"],
            earned_credits=live_data["earned_credits"],
            gpa=live_data["gpa"],
            result_status=live_data["result_status"],
            arrears_count=live_data["arrears_count"],
            standing_arrears_count=live_data["arrears_count"],
            is_verified=True,
            verified_at=datetime.now(timezone.utc)
        )
        db.add(student_res)
        db.commit()
        db.refresh(student_res)

    # 6. Insert Subject Results
    for c in live_data["courses"]:
        sub_obj = subject_map.get(c["code"])
        if sub_obj:
            sr = SubjectResult(
                student_result_id=student_res.id,
                subject_id=sub_obj.id,
                grade=c["grade"],
                result_status=c["result"],
                credits=c["credits"],
                is_arrear=(c["result"] != "PASS")
            )
            db.add(sr)
    db.commit()

    # 7. Generate Authentic Marksheet PDF & Verify
    try:
        pdf_path = generate_marksheet_pdf(
            student=student,
            session=exam_session,
            subject_results=live_data["courses"]
        )
        verify_and_store_pdf(
            db=db,
            student=student,
            session=exam_session,
            pdf_path=pdf_path
        )
    except Exception as e:
        print(f"Error generating marksheet PDF for {reg_no}: {e}")

    return student_res


def generate_nandha_bulk_template() -> io.BytesIO:
    """
    Generates an official, styled Excel (.xlsx) template for bulk fetching results
    from the Nandha Engineering College COE portal.
    """
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Nandha Bulk Sync Template"
    if ws.views.sheetView:
        ws.views.sheetView[0].showGridLines = True
    else:
        ws.sheet_view.showGridLines = True

    font_title = Font(name="Times New Roman", size=13, bold=True, color="000000")
    font_sub = Font(name="Times New Roman", size=10, italic=True, color="334155")
    font_hdr = Font(name="Times New Roman", size=11, bold=True, color="000000")
    font_row = Font(name="Times New Roman", size=11, color="000000")

    fill_title = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    fill_sub = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_hdr = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    thin_border = Side(border_style="thin", color="000000")
    all_border = Border(left=thin_border, right=thin_border, top=thin_border, bottom=thin_border)

    ws.merge_cells("A1:C1")
    t_cell = ws.cell(row=1, column=1, value="NANDHA ENGINEERING COLLEGE (AUTONOMOUS) - BULK RESULT SYNC")
    t_cell.font = font_title
    t_cell.fill = fill_title
    t_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    ws.merge_cells("A2:C2")
    sub_cell = ws.cell(
        row=2, column=1,
        value="Enter Candidate Register Number and Date of Birth (DD/MM/YYYY). Leading zeroes in Reg No are preserved."
    )
    sub_cell.font = font_sub
    sub_cell.fill = fill_sub
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20

    headers = [
        "Register Number *",
        "Date of Birth (DD/MM/YYYY) *",
        "Student Name (Optional Reference)"
    ]

    ws.row_dimensions[3].height = 24
    for c_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=c_idx, value=h)
        cell.font = font_hdr
        cell.fill = fill_hdr
        cell.border = all_border
        cell.alignment = Alignment(horizontal="center", vertical="center")

    samples = [
        ("732224CC031", "01/06/2007", "Nanthish S"),
        ("732224CC001", "15/04/2006", "Aakash M"),
        ("732224CC002", "22/08/2006", "Bhavani R"),
    ]

    for r_idx, (reg, dob, name) in enumerate(samples, 4):
        ws.row_dimensions[r_idx].height = 20
        c1 = ws.cell(row=r_idx, column=1, value=reg)
        c1.font = font_row
        c1.fill = fill_white
        c1.border = all_border
        c1.number_format = "@"
        c1.alignment = Alignment(horizontal="center", vertical="center")

        c2 = ws.cell(row=r_idx, column=2, value=dob)
        c2.font = font_row
        c2.fill = fill_white
        c2.border = all_border
        c2.number_format = "@"
        c2.alignment = Alignment(horizontal="center", vertical="center")

        c3 = ws.cell(row=r_idx, column=3, value=name)
        c3.font = font_row
        c3.fill = fill_white
        c3.border = all_border
        c3.alignment = Alignment(horizontal="left", vertical="center")

    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 28
    ws.column_dimensions["C"].width = 34

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def parse_nandha_bulk_file(file_content: bytes, filename: str) -> List[Dict[str, str]]:
    """
    Parses an uploaded .xlsx, .xls, or .csv file containing student credentials
    for bulk Nandha COE synchronization.
    """
    records: List[Dict[str, str]] = []
    fname = filename.lower()

    if fname.endswith(".csv"):
        text = file_content.decode("utf-8-sig", errors="ignore")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return records

        reg_idx, dob_idx = 0, 1
        start_row = 0

        # Scan for header
        for r_i, row in enumerate(rows[:5]):
            row_lower = [str(c).lower().strip() for c in row]
            for c_i, h in enumerate(row_lower):
                if "reg" in h or "roll" in h or "register" in h:
                    reg_idx = c_i
                elif "dob" in h or "birth" in h or "date" in h:
                    dob_idx = c_i
            if any("reg" in h for h in row_lower):
                start_row = r_i + 1
                break

        for row in rows[start_row:]:
            if len(row) > max(reg_idx, dob_idx):
                reg = str(row[reg_idx]).strip().upper()
                dob = str(row[dob_idx]).strip()
                if reg and dob and reg != "REGISTER NUMBER":
                    records.append({"register_number": reg, "dob": dob})

    else:
        # Excel .xlsx parsing
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        ws = wb.active

        reg_col, dob_col = 1, 2
        start_row = 1

        for r in range(1, min(6, ws.max_row + 1)):
            vals = [str(ws.cell(row=r, column=c).value or "").lower().strip() for c in range(1, ws.max_column + 1)]
            for c_idx, val in enumerate(vals, 1):
                if "reg" in val or "roll" in val:
                    reg_col = c_idx
                elif "dob" in val or "birth" in val:
                    dob_col = c_idx
            if any("reg" in v for v in vals):
                start_row = r + 1
                break

        for r in range(start_row, ws.max_row + 1):
            reg_val = ws.cell(row=r, column=reg_col).value
            dob_val = ws.cell(row=r, column=dob_col).value

            if reg_val is not None and dob_val is not None:
                reg_str = str(reg_val).strip().upper()
                # Handle Excel date objects
                if isinstance(dob_val, datetime):
                    dob_str = dob_val.strftime("%d/%m/%Y")
                else:
                    dob_str = str(dob_val).strip()

                if reg_str and dob_str and "REGISTER" not in reg_str:
                    records.append({"register_number": reg_str, "dob": dob_str})

    return records


def bulk_sync_nandha_results(
    db: Session,
    records: List[Dict[str, str]],
    session_id: int
) -> Dict[str, Any]:
    """
    Performs sequential live portal synchronization for a batch of student credentials.
    """
    successes = []
    failures = []

    for item in records:
        reg_no = item.get("register_number", "").strip().upper()
        dob = item.get("dob", "").strip()

        if not reg_no or not dob:
            failures.append({
                "register_number": reg_no or "UNKNOWN",
                "error": "Missing Register Number or Date of Birth"
            })
            continue

        try:
            live_data = fetch_live_coe_result(reg_no, dob)
            res_obj = import_or_update_live_result(db, live_data, session_id)
            successes.append({
                "register_number": live_data["register_number"],
                "student_name": live_data["student_name"],
                "branch_name": live_data["branch_name"],
                "gpa": live_data["gpa"],
                "total_credits": live_data["total_credits"],
                "earned_credits": live_data["earned_credits"],
                "result_status": live_data["result_status"],
                "arrears_count": live_data["arrears_count"],
                "result_id": res_obj.id
            })
        except Exception as e:
            failures.append({
                "register_number": reg_no,
                "error": str(e)
            })

    return {
        "total_submitted": len(records),
        "success_count": len(successes),
        "failed_count": len(failures),
        "results": successes,
        "errors": failures
    }

