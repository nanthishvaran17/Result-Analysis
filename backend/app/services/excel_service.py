import os
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import CellIsRule
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.session import ExamSession
from app.models.student import Student
from app.models.subject import Subject
from app.models.result import StudentResult, SubjectResult
from app.models.excel_report import ExcelReport
from app.models.job import AutomationJobLog
from app.services.result_service import get_result_matrix, PASSING_GRADES, GRADE_POINTS

# Enterprise Brand Colors
NAVY_HEADER = "0F172A"       # Deep Navy / Slate 900
NAVY_SUBHEADER = "1E293B"    # Slate 800
ACCENT_BLUE = "2563EB"       # Royal Blue
ZEBRA_ROW = "F8FAFC"         # Clean Light Grey / Slate 50
BORDER_COLOR = "CBD5E1"      # Slate 300
PASS_FILL = "DCFCE7"         # Green 100
PASS_FONT = "15803D"         # Green 700
FAIL_FILL = "FEE2E2"         # Red 100
FAIL_FONT = "B91C1C"         # Red 700

font_title = Font(name="Calibri", size=15, bold=True, color="FFFFFF")
font_subtitle = Font(name="Calibri", size=10, italic=True, color="CBD5E1")
font_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
font_sub_header = Font(name="Calibri", size=8, bold=False, color="E2E8F0")
font_data = Font(name="Calibri", size=10, color="000000")
font_bold_data = Font(name="Calibri", size=10, bold=True, color="000000")
font_kpi_num = Font(name="Calibri", size=13, bold=True, color="0F172A")
font_kpi_label = Font(name="Calibri", size=9, bold=True, color="64748B")

fill_header = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
fill_sub_header = PatternFill(start_color=NAVY_SUBHEADER, end_color=NAVY_SUBHEADER, fill_type="solid")
fill_zebra = PatternFill(start_color=ZEBRA_ROW, end_color=ZEBRA_ROW, fill_type="solid")
fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_kpi = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

thin_side = Side(border_style="thin", color=BORDER_COLOR)
table_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
double_bottom = Border(left=thin_side, right=thin_side, top=thin_side, bottom=Side(border_style="double", color="0F172A"))

align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

def apply_auto_column_widths(ws, min_col=1, max_col=None):
    if not max_col:
        max_col = ws.max_column
    for col_idx in range(min_col, max_col + 1):
        col_letter = get_column_letter(col_idx)
        max_len = 0
        for cell in ws[col_letter]:
            val = cell.value
            if val is not None and cell.row > 4:  # Skip huge title banners
                val_str = str(val)
                if len(val_str) > max_len:
                    max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 11)

def build_result_analysis_sheet(ws, matrix):
    ws.title = "Result Analysis"
    ws.views.sheetView[0].showGridLines = True

    # Title Block Banner (Rows 1 to 3)
    ws.merge_cells("A1:K1")
    ws["A1"] = settings.INSTITUTION_NAME.upper()
    ws["A1"].font = font_title
    ws["A1"].fill = fill_header
    ws["A1"].alignment = align_center

    ws.merge_cells("A2:K2")
    ws["A2"] = f"OFFICE OF CONTROLLER OF EXAMINATIONS — COMPREHENSIVE RESULT ANALYSIS ({matrix.session_code})"
    ws["A2"].font = font_header
    ws["A2"].fill = fill_header
    ws["A2"].alignment = align_center

    ws.merge_cells("A3:K3")
    meta_info = f"Department: {matrix.department_code or 'ALL'} | Total Candidates: {matrix.total_students} | Pass Rate: {matrix.pass_percentage}% | Avg GPA: {matrix.average_gpa} | Exported: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
    ws["A3"] = meta_info
    ws["A3"].font = font_subtitle
    ws["A3"].fill = fill_header
    ws["A3"].alignment = align_center

    ws.row_dimensions[1].height = 25
    ws.row_dimensions[2].height = 20
    ws.row_dimensions[3].height = 18

    # Row 5: Table Header
    headers = [
        "S.No", "Register No", "Student Name", "Branch", "Batch", "Sem"
    ]
    sub_col_start = len(headers) + 1

    for col in matrix.columns:
        headers.append(col.code)

    headers.extend(["Current Arrears", "Standing Arrears", "GPA", "Result Status", "Verified"])

    row_num = 5
    ws.row_dimensions[row_num].height = 28

    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=row_num, column=col_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = table_border

    # Data Rows (Row 6 onwards)
    data_start_row = 6
    for i, student in enumerate(matrix.rows, 1):
        r = data_start_row + i - 1
        ws.row_dimensions[r].height = 20
        row_fill = fill_zebra if i % 2 == 0 else fill_white

        # Base Columns
        ws.cell(row=r, column=1, value=i).alignment = align_center
        # Set Register Number explicitly as string
        reg_cell = ws.cell(row=r, column=2, value=str(student.register_number))
        reg_cell.number_format = "@"
        reg_cell.alignment = align_center

        ws.cell(row=r, column=3, value=student.student_name).alignment = align_left
        ws.cell(row=r, column=4, value=student.department_code).alignment = align_center
        ws.cell(row=r, column=5, value=student.batch).alignment = align_center
        ws.cell(row=r, column=6, value=student.semester).alignment = align_center

        # Subject Grades
        for s_idx, sub in enumerate(matrix.columns):
            c_idx = sub_col_start + s_idx
            grade = student.grades.get(sub.code, "-")
            grade_cell = ws.cell(row=r, column=c_idx, value=grade)
            grade_cell.alignment = align_center
            if grade in ["RA", "SA", "AB", "W"]:
                grade_cell.font = Font(name="Calibri", size=10, bold=True, color="B91C1C")
                grade_cell.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
            elif grade in PASSING_GRADES:
                grade_cell.font = Font(name="Calibri", size=10, bold=True, color="15803D")

        # Academic Totals & Status
        curr_arr_col = sub_col_start + len(matrix.columns)
        stand_arr_col = curr_arr_col + 1
        gpa_col = stand_arr_col + 1
        status_col = gpa_col + 1
        verif_col = status_col + 1

        ws.cell(row=r, column=curr_arr_col, value=student.arrears_count).alignment = align_center
        ws.cell(row=r, column=stand_arr_col, value=student.standing_arrears_count).alignment = align_center
        
        gpa_cell = ws.cell(row=r, column=gpa_col, value=student.gpa)
        gpa_cell.number_format = "0.00"
        gpa_cell.alignment = align_center

        status_cell = ws.cell(row=r, column=status_col, value=student.result_status)
        status_cell.alignment = align_center
        if student.result_status == "PASS":
            status_cell.fill = PatternFill(start_color=PASS_FILL, end_color=PASS_FILL, fill_type="solid")
            status_cell.font = Font(name="Calibri", size=10, bold=True, color=PASS_FONT)
        else:
            status_cell.fill = PatternFill(start_color=FAIL_FILL, end_color=FAIL_FILL, fill_type="solid")
            status_cell.font = Font(name="Calibri", size=10, bold=True, color=FAIL_FONT)

        ws.cell(row=r, column=verif_col, value="VERIFIED" if student.is_verified else "PENDING").alignment = align_center

        # Apply borders and row zebra fill
        for c in range(1, len(headers) + 1):
            cl = ws.cell(row=r, column=c)
            cl.border = table_border
            if not cl.fill or cl.fill.fill_type is None:
                cl.fill = row_fill

    # Freeze panes below header row and after student name
    ws.freeze_panes = "D6"

    # Enable AutoFilter across all headers
    last_col_letter = get_column_letter(len(headers))
    last_row = data_start_row + len(matrix.rows) - 1 if matrix.rows else 5
    ws.auto_filter.ref = f"A5:{last_col_letter}{last_row}"

    apply_auto_column_widths(ws)

def build_summary_sheet(ws, matrix):
    ws.title = "Summary"
    ws.views.sheetView[0].showGridLines = True

    # Title Banner
    ws.merge_cells("A1:G1")
    ws["A1"] = f"PERFORMANCE SUMMARY & GRADE DISTRIBUTION — {matrix.session_code}"
    ws["A1"].font = font_title
    ws["A1"].fill = fill_header
    ws["A1"].alignment = align_center
    ws.row_dimensions[1].height = 25

    # Overall Metrics KPI Cards (Rows 3-4)
    kpis = [
        ("Total Appeared", matrix.total_students),
        ("Total Passed", matrix.passed_students),
        ("Total Failed", matrix.failed_students),
        ("Overall Pass %", f"{matrix.pass_percentage}%"),
        ("Average GPA", matrix.average_gpa)
    ]

    for idx, (label, val) in enumerate(kpis, 1):
        cell_lbl = ws.cell(row=3, column=idx, value=label)
        cell_lbl.font = font_kpi_label
        cell_lbl.fill = fill_kpi
        cell_lbl.alignment = align_center
        cell_lbl.border = table_border

        cell_val = ws.cell(row=4, column=idx, value=val)
        cell_val.font = font_kpi_num
        cell_val.fill = fill_kpi
        cell_val.alignment = align_center
        cell_val.border = table_border

    ws.row_dimensions[3].height = 18
    ws.row_dimensions[4].height = 24

    # Subject-wise Breakdown Table (Row 7)
    sub_headers = ["S.No", "Subject Code", "Subject Name", "Credits", "Appeared", "Passed", "Failed", "Pass %", "O", "A+", "A", "B+", "B", "C", "RA"]
    ws.row_dimensions[7].height = 24
    for c_idx, h in enumerate(sub_headers, 1):
        cell = ws.cell(row=7, column=c_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = table_border

    # Compute Subject Breakdown Data
    for i, sub in enumerate(matrix.columns, 1):
        r = 7 + i
        ws.row_dimensions[r].height = 19
        row_fill = fill_zebra if i % 2 == 0 else fill_white

        # Count grades
        appeared = 0
        passed = 0
        failed = 0
        grade_counts = {g: 0 for g in ["O", "A+", "A", "B+", "B", "C", "RA"]}

        for student in matrix.rows:
            gr = student.grades.get(sub.code)
            if gr and gr != "-":
                appeared += 1
                if gr in PASSING_GRADES:
                    passed += 1
                else:
                    failed += 1
                if gr in grade_counts:
                    grade_counts[gr] += 1

        sub_pass_pct = round((passed / appeared * 100), 2) if appeared > 0 else 0.0

        row_vals = [
            i, sub.code, sub.name, sub.credits, appeared, passed, failed, f"{sub_pass_pct}%",
            grade_counts["O"], grade_counts["A+"], grade_counts["A"], grade_counts["B+"], grade_counts["B"], grade_counts["C"], grade_counts["RA"]
        ]

        for c_idx, v in enumerate(row_vals, 1):
            cl = ws.cell(row=r, column=c_idx, value=v)
            cl.font = font_data
            cl.alignment = align_left if c_idx == 3 else align_center
            cl.fill = row_fill
            cl.border = table_border

    apply_auto_column_widths(ws)

def build_arrear_analysis_sheet(ws, matrix):
    ws.title = "Arrear Analysis"
    ws.views.sheetView[0].showGridLines = True

    ws.merge_cells("A1:G1")
    ws["A1"] = f"ARREAR ANALYSIS & STANDING ARREARS REPORT — {matrix.session_code}"
    ws["A1"].font = font_title
    ws["A1"].fill = fill_header
    ws["A1"].alignment = align_center
    ws.row_dimensions[1].height = 25

    headers = ["S.No", "Register No", "Student Name", "Department", "Current Arrears", "Standing Arrears", "Failed Subject Codes"]
    ws.row_dimensions[3].height = 24
    for c_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=c_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = table_border

    arrear_students = [s for s in matrix.rows if s.arrears_count > 0 or s.standing_arrears_count > 0]
    
    for i, s in enumerate(arrear_students, 1):
        r = 3 + i
        ws.row_dimensions[r].height = 20
        row_fill = fill_zebra if i % 2 == 0 else fill_white

        failed_subs = [code for code, status in s.subject_statuses.items() if status == "RA"]

        vals = [
            i, str(s.register_number), s.student_name, s.department_code,
            s.arrears_count, s.standing_arrears_count, ", ".join(failed_subs)
        ]

        for c_idx, v in enumerate(vals, 1):
            cl = ws.cell(row=r, column=c_idx, value=v)
            cl.font = font_data
            cl.alignment = align_left if c_idx in [3, 7] else align_center
            cl.fill = row_fill
            cl.border = table_border
            if c_idx == 2:
                cl.number_format = "@"

    apply_auto_column_widths(ws)

def build_processing_log_sheet(ws, db, matrix):
    ws.title = "Processing Log"
    ws.views.sheetView[0].showGridLines = True

    ws.merge_cells("A1:G1")
    ws["A1"] = f"RESULT RETRIEVAL & EXTRACTION AUDIT LOG — {matrix.session_code}"
    ws["A1"].font = font_title
    ws["A1"].fill = fill_header
    ws["A1"].alignment = align_center
    ws.row_dimensions[1].height = 25

    headers = ["Log ID", "Register No", "Student Name", "Stage", "Status", "Processing Details", "Timestamp"]
    ws.row_dimensions[3].height = 24
    for c_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=c_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = table_border

    logs = db.query(AutomationJobLog).order_by(AutomationJobLog.id.desc()).limit(150).all()

    for i, l in enumerate(logs, 1):
        r = 3 + i
        ws.row_dimensions[r].height = 19
        row_fill = fill_zebra if i % 2 == 0 else fill_white

        vals = [
            l.id, str(l.register_number), l.student_name or "-", l.stage, l.status,
            l.message, l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ]

        for c_idx, v in enumerate(vals, 1):
            cl = ws.cell(row=r, column=c_idx, value=v)
            cl.font = font_data
            cl.alignment = align_left if c_idx in [3, 6] else align_center
            cl.fill = row_fill
            cl.border = table_border
            if c_idx == 2:
                cl.number_format = "@"

    apply_auto_column_widths(ws)

def build_subject_mapping_sheet(ws, matrix):
    ws.title = "Subject Mapping"
    ws.views.sheetView[0].showGridLines = True

    ws.merge_cells("A1:E1")
    ws["A1"] = f"COURSE SYLLABUS & SUBJECT DEFINITIONS — {matrix.session_code}"
    ws["A1"].font = font_title
    ws["A1"].fill = fill_header
    ws["A1"].alignment = align_center
    ws.row_dimensions[1].height = 25

    headers = ["S.No", "Subject Code", "Course Title", "Credits", "Department"]
    ws.row_dimensions[3].height = 24
    for c_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=c_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = table_border

    for i, sub in enumerate(matrix.columns, 1):
        r = 3 + i
        ws.row_dimensions[r].height = 19
        row_fill = fill_zebra if i % 2 == 0 else fill_white

        vals = [i, sub.code, sub.name, sub.credits, matrix.department_code or "ALL"]
        for c_idx, v in enumerate(vals, 1):
            cl = ws.cell(row=r, column=c_idx, value=v)
            cl.font = font_data
            cl.alignment = align_left if c_idx == 3 else align_center
            cl.fill = row_fill
            cl.border = table_border

    apply_auto_column_widths(ws)

def validate_generated_workbook(file_path: str, expected_sheets: List[str]) -> Tuple[bool, str]:
    """
    Reopens and verifies workbook structural integrity, sheet presence, and cell content.
    """
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        sheet_names = wb.sheetnames

        for s in expected_sheets:
            if s not in sheet_names:
                return False, f"Missing required worksheet: {s}"

        # Verify Result Analysis has data
        ra_sheet = wb["Result Analysis"]
        if ra_sheet.max_row < 5:
            return False, "Result Analysis sheet is empty or missing headers."

        return True, "Workbook integrity verified successfully."
    except Exception as e:
        return False, f"Workbook verification failed: {str(e)}"

def generate_enterprise_excel_report(
    db: Session,
    session_id: int,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    generated_by: str = "SYSTEM"
) -> ExcelReport:
    """
    Generates, formats, verifies, and records an enterprise examination analysis report.
    """
    matrix = get_result_matrix(db, session_id, department_code, batch, semester)
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()

    wb = openpyxl.Workbook()
    # Remove default sheet
    default_sheet = wb.active

    # 1. Result Analysis Sheet
    ws_ra = wb.create_sheet("Result Analysis")
    build_result_analysis_sheet(ws_ra, matrix)

    # 2. Summary Sheet
    ws_sum = wb.create_sheet("Summary")
    build_summary_sheet(ws_sum, matrix)

    # 3. Arrear Analysis Sheet
    ws_arr = wb.create_sheet("Arrear Analysis")
    build_arrear_analysis_sheet(ws_arr, matrix)

    # 4. Processing Log Sheet
    ws_log = wb.create_sheet("Processing Log")
    build_processing_log_sheet(ws_log, db, matrix)

    # 5. Subject Mapping Sheet
    ws_sub = wb.create_sheet("Subject Mapping")
    build_subject_mapping_sheet(ws_sub, matrix)

    # Remove initial empty sheet
    wb.remove(default_sheet)

    # File naming & storage
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    dept_str = department_code or "ALL"
    filename = f"EXAM_RESULT_{matrix.session_code}_{dept_str}_{timestamp_str}.xlsx"
    file_path = str(settings.REPORTS_DIR / filename)

    wb.save(file_path)

    # Validation
    expected_sheets = ["Result Analysis", "Summary", "Arrear Analysis", "Processing Log", "Subject Mapping"]
    is_valid, validation_notes = validate_generated_workbook(file_path, expected_sheets)

    # Compute SHA256 & file size
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(block)
    file_hash = sha256_hash.hexdigest()
    file_size = os.path.getsize(file_path)

    # Store in database
    report = ExcelReport(
        session_id=session_id,
        department_code=department_code,
        batch=batch,
        semester=semester,
        report_name=filename,
        file_path=file_path,
        file_size=file_size,
        file_hash=file_hash,
        total_students=matrix.total_students,
        total_subjects=len(matrix.columns),
        pass_percentage=matrix.pass_percentage,
        is_valid=is_valid,
        validation_notes=validation_notes,
        generated_by=generated_by
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report
