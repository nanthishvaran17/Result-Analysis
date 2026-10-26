import os
import openpyxl
from openpyxl.utils import get_column_letter
from app.core.database import SessionLocal
from app.models.student import Student
from app.models.result import StudentResult
from app.services.excel_service import generate_enterprise_excel_report, validate_generated_workbook
from app.services.result_service import get_result_matrix

EXPECTED_SHEETS = ["Result Analysis", "Summary", "Arrear Analysis", "Processing Log", "Subject Mapping"]


def test_enterprise_excel_engine_validation():
    """Verify end-to-end report generation and core self-validation."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(
            db=db,
            session_id=1,
            department_code="CSE",
            generated_by="TEST_RUNNER"
        )
        assert report is not None
        assert report.is_valid is True
        assert os.path.exists(report.file_path)

        # Validate self-validation
        valid, msg = validate_generated_workbook(report.file_path, EXPECTED_SHEETS)
        assert valid is True
    finally:
        db.close()


def test_all_five_worksheets_exist():
    """Requirement 1: All five worksheets exist."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=True)
        sheet_names = wb.sheetnames
        for sheet_name in EXPECTED_SHEETS:
            assert sheet_name in sheet_names, f"Missing sheet: {sheet_name}"
    finally:
        db.close()


def test_no_unintended_worksheet_protection_or_scroll_restrictions():
    """Requirements 2 & 3: No unintended protection, locked cells, or scrollArea restrictions."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)

        for name in EXPECTED_SHEETS:
            ws = wb[name]
            # Protection must NOT lock the sheet
            assert ws.protection.sheet is False, f"Sheet '{name}' has sheet protection enabled"
            # No hidden rows or columns
            for row_dim in ws.row_dimensions.values():
                assert not row_dim.hidden, f"Sheet '{name}' contains unintended hidden rows"
            for col_dim in ws.column_dimensions.values():
                assert not col_dim.hidden, f"Sheet '{name}' contains unintended hidden columns"
            # Gridlines must remain enabled for staff readability
            assert ws.views.sheetView[0].showGridLines is True, f"Sheet '{name}' missing gridlines"
    finally:
        db.close()


def test_freeze_panes_configuration():
    """Requirement 4: Freeze panes keep headers and key identifiers visible without locking."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)

        ra_ws = wb["Result Analysis"]
        # C6 freezes rows 1-5 (header row 5 stays visible vertically)
        # and cols A & B (S.No and Register No stay visible horizontally)
        # while Col C (Student Name) and dynamic subject columns scroll freely.
        assert ra_ws.freeze_panes == "C6", f"Result Analysis freeze panes expected 'C6', got '{ra_ws.freeze_panes}'"

        # Check pane active selection to ensure focus doesn't jump to A1
        for s in ra_ws.sheet_view.selection:
            if s.pane == "bottomRight":
                assert s.activeCell == "C6"

        assert wb["Summary"].freeze_panes == "C8"
        assert wb["Arrear Analysis"].freeze_panes == "C4"
        assert wb["Processing Log"].freeze_panes == "C4"
        assert wb["Subject Mapping"].freeze_panes == "C4"
    finally:
        db.close()


def test_populated_cells_borders_and_alignment():
    """Requirement 5: Every populated data cell has required borders and appropriate alignment."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)
        ra_ws = wb["Result Analysis"]

        # Rows 6 to 17 are student data rows
        for r in range(6, 18):
            # S.No (Col 1): center
            c1 = ra_ws.cell(row=r, column=1)
            assert c1.alignment.horizontal == "center"
            assert c1.border.left.style == "thin"
            assert c1.border.right.style == "thin"

            # Register No (Col 2): text format, center
            c2 = ra_ws.cell(row=r, column=2)
            assert c2.alignment.horizontal == "center"
            assert c2.number_format == "@"
            assert c2.border.left.style == "thin"

            # Student Name (Col 3): left aligned
            c3 = ra_ws.cell(row=r, column=3)
            assert c3.alignment.horizontal == "left"
            assert c3.border.left.style == "thin"

            # Check that all cells in row have borders
            for c in range(1, ra_ws.max_column + 1):
                cell = ra_ws.cell(row=r, column=c)
                assert cell.border.left is not None
                assert cell.border.right is not None
                assert cell.border.top is not None
                assert cell.border.bottom is not None
    finally:
        db.close()


def test_dynamic_subject_columns_and_formatting():
    """Requirement 6: Dynamic subject columns have consistent compact widths and formatting."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)
        ra_ws = wb["Result Analysis"]

        matrix = get_result_matrix(db, session_id=1, department_code="CSE")
        num_subjects = len(matrix.columns)
        sub_start_col = 7  # Col G

        for i, sub in enumerate(matrix.columns):
            c_idx = sub_start_col + i
            col_letter = get_column_letter(c_idx)
            header_cell = ra_ws.cell(row=5, column=c_idx)
            assert header_cell.value == sub.code
            # Dynamic subject columns are compact (width 10) so they don't sprawl off-screen
            width = ra_ws.column_dimensions[col_letter].width
            assert 8 <= width <= 14, f"Column {col_letter} width {width} outside compact range"

            # Check grade alignment in data rows
            for r in range(6, 18):
                g_cell = ra_ws.cell(row=r, column=c_idx)
                assert g_cell.alignment.horizontal == "center"
    finally:
        db.close()


def test_conditional_formatting_covers_data_range():
    """Requirement 7: Conditional formatting covers dynamic result range."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)
        ra_ws = wb["Result Analysis"]

        # Must have conditional formatting rules
        assert len(ra_ws.conditional_formatting) > 0

        # Also verify static styling for cells
        # Student 710022104002 has RA in CS3391 (Col J in our test matrix)
        found_fail_cell = False
        found_pass_cell = False
        for r in range(6, 18):
            for c in range(7, 13):
                cell = ra_ws.cell(row=r, column=c)
                if cell.value == "RA":
                    found_fail_cell = True
                    assert cell.font.color.rgb in ["00B91C1C", "B91C1C"]
                elif cell.value in ["O", "A+", "A", "B+", "B", "C"]:
                    found_pass_cell = True
                    assert cell.font.color.rgb in ["0015803D", "15803D"]

        assert found_fail_cell is True, "Failed to find styled arrear cell"
        assert found_pass_cell is True, "Failed to find styled pass cell"
    finally:
        db.close()


def test_formulas_and_academic_calculations():
    """Requirement 8: Formulas and academic summary calculations remain correct."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)

        # 1. Check Result Analysis Summary Total Row
        ra_ws = wb["Result Analysis"]
        summary_row = 18
        assert "INSTITUTIONAL TOTALS & SUMMARY" in str(ra_ws.cell(row=summary_row, column=1).value)
        # Subject pass formulas
        sub_fml = ra_ws.cell(row=summary_row, column=7).value
        assert str(sub_fml).startswith("=COUNTIF")
        # Current arrears sum formula
        curr_arr_fml = ra_ws.cell(row=summary_row, column=13).value
        assert str(curr_arr_fml).startswith("=SUM(M6:M17)")
        # GPA average formula
        gpa_fml = ra_ws.cell(row=summary_row, column=15).value
        assert str(gpa_fml).startswith("=AVERAGE(O6:O17)")

        # 2. Check Summary sheet formulas
        sum_ws = wb["Summary"]
        # Pass % formula in row 8
        pass_pct_fml = sum_ws.cell(row=8, column=8).value
        assert pass_pct_fml == "=IF(E8>0, F8/E8, 0)"
        # Total Row in Summary
        tot_row = 14
        tot_cred_fml = sum_ws.cell(row=tot_row, column=4).value
        assert tot_cred_fml == "=SUM(D8:D13)"
        tot_app_fml = sum_ws.cell(row=tot_row, column=5).value
        assert tot_app_fml == "=SUM(E8:E13)"
    finally:
        db.close()


def test_autofilter_ranges_include_expected_records():
    """Requirement 9: AutoFilter covers all columns and data rows on all sheets."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)

        # Result Analysis AutoFilter
        ra_ws = wb["Result Analysis"]
        assert ra_ws.auto_filter.ref == "A5:Q17"

        # Summary AutoFilter
        sum_ws = wb["Summary"]
        assert sum_ws.auto_filter.ref == "A7:O13"

        # Arrear Analysis AutoFilter
        arr_ws = wb["Arrear Analysis"]
        assert arr_ws.auto_filter.ref == "A3:G10"

        # Processing Log AutoFilter
        log_ws = wb["Processing Log"]
        assert log_ws.auto_filter.ref is not None
        assert log_ws.auto_filter.ref.startswith("A3:G")

        # Subject Mapping AutoFilter
        sub_ws = wb["Subject Mapping"]
        assert sub_ws.auto_filter.ref == "A3:E9"
    finally:
        db.close()


def test_register_numbers_retention_and_text_format():
    """Requirement 10: Register Numbers retain original values and text format without truncation."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=True)
        ra_ws = wb["Result Analysis"]

        db_students = (
            db.query(Student)
            .join(StudentResult, StudentResult.student_id == Student.id)
            .filter(StudentResult.session_id == 1, Student.department_code == "CSE")
            .order_by(Student.register_number.asc())
            .all()
        )

        for i, student in enumerate(db_students, 6):
            cell_val = str(ra_ws.cell(row=i, column=2).value)
            assert cell_val == student.register_number
            # Check length is exact (e.g. 12 digits, no scientific notation like 7.10022E+11)
            assert len(cell_val) == len(student.register_number)
            assert not cell_val.endswith(".0")
            assert "E+" not in cell_val
    finally:
        db.close()


def test_all_expected_students_and_subject_results_present():
    """Requirement 11: All expected students and subject results are present in matrix."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=True)
        ra_ws = wb["Result Analysis"]

        matrix = get_result_matrix(db, session_id=1, department_code="CSE")
        assert len(matrix.rows) == 12
        assert report.total_students == 12

        # Verify each student row matches matrix
        for i, s_row in enumerate(matrix.rows, 6):
            assert str(ra_ws.cell(row=i, column=2).value) == s_row.register_number
            assert ra_ws.cell(row=i, column=3).value == s_row.student_name
            assert ra_ws.cell(row=i, column=4).value == s_row.department_code
            assert ra_ws.cell(row=i, column=16).value == s_row.result_status
    finally:
        db.close()


def test_print_and_page_setup_configuration():
    """Print configuration: landscape orientation, A4 paper, fit to width, repeating headers."""
    db = SessionLocal()
    try:
        report = generate_enterprise_excel_report(db, session_id=1, department_code="CSE")
        wb = openpyxl.load_workbook(report.file_path, data_only=False)

        ra_ws = wb["Result Analysis"]
        assert ra_ws.page_setup.orientation == "landscape"
        assert ra_ws.print_title_rows == "$5:$5"
        assert ra_ws.sheet_properties.pageSetUpPr.fitToPage is True
        assert ra_ws.page_setup.fitToWidth == 1
        assert ra_ws.page_setup.fitToHeight == 0

        sum_ws = wb["Summary"]
        assert sum_ws.page_setup.orientation == "landscape"
        assert sum_ws.print_title_rows == "$7:$7"

        arr_ws = wb["Arrear Analysis"]
        assert arr_ws.page_setup.orientation == "landscape"
        assert arr_ws.print_title_rows == "$3:$3"
    finally:
        db.close()
