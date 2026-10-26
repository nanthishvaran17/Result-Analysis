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
