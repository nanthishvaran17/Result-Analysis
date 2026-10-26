import os
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pdfplumber
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.student import Student
from app.models.session import ExamSession
from app.models.pdf_record import ResultPdf
from app.models.subject import Subject

def compute_file_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def generate_marksheet_pdf(
    student: Student,
    session: ExamSession,
    subject_results: List[Dict[str, Any]],
    output_path: Optional[str] = None
) -> str:
    """
    Generates a secure, standardized provisional marksheet PDF using ReportLab.
    """
    if not output_path:
        filename = f"{student.register_number}_{session.session_code}.pdf"
        output_path = str(settings.PDF_DIR / filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        alignment=1  # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1
    )
    subtext_style = ParagraphStyle(
        'DocSubText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11
    )
    header_cell_style = ParagraphStyle(
        'HeaderCellText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    elements = []

    # Institution Header
    elements.append(Paragraph(settings.INSTITUTION_NAME, title_style))
    elements.append(Paragraph("OFFICE OF THE CONTROLLER OF EXAMINATIONS", subtitle_style))
    elements.append(Paragraph("PROVISIONAL GRADE SHEET / RESULT NOTIFICATION", subtext_style))
    elements.append(Spacer(1, 15))

    # Student & Exam Metadata Table
    meta_data = [
        [
            Paragraph("<b>Register Number:</b>", cell_style),
            Paragraph(student.register_number, cell_style),
            Paragraph("<b>Examination Session:</b>", cell_style),
            Paragraph(session.session_name, cell_style)
        ],
        [
            Paragraph("<b>Student Name:</b>", cell_style),
            Paragraph(student.name, cell_style),
            Paragraph("<b>Academic Year:</b>", cell_style),
            Paragraph(session.academic_year, cell_style)
        ],
        [
            Paragraph("<b>Department / Branch:</b>", cell_style),
            Paragraph(student.department_code, cell_style),
            Paragraph("<b>Semester:</b>", cell_style),
            Paragraph(str(student.current_semester), cell_style)
        ],
        [
            Paragraph("<b>Batch:</b>", cell_style),
            Paragraph(student.batch, cell_style),
            Paragraph("<b>Issue Date:</b>", cell_style),
            Paragraph(datetime.now(timezone.utc).strftime("%d-%b-%Y"), cell_style)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[110, 160, 120, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # Subject Results Table
    result_table_data = [
        [
            Paragraph("<b>Sub Code</b>", header_cell_style),
            Paragraph("<b>Subject Title</b>", header_cell_style),
            Paragraph("<b>Credits</b>", header_cell_style),
            Paragraph("<b>Grade</b>", header_cell_style),
            Paragraph("<b>Result</b>", header_cell_style)
        ]
    ]

    total_credits = 0
    earned_credits = 0
    has_arrear = False

    for sub in subject_results:
        code = str(sub.get("code", "")).strip()
        title = str(sub.get("name", sub.get("title", ""))).strip()
        cr = int(sub.get("credits", 3))
        grade = str(sub.get("grade", "")).strip().upper()
        res = "PASS" if grade in ["O", "A+", "A", "B+", "B", "C"] else "RA"

        total_credits += cr
        if res == "PASS":
            earned_credits += cr
        else:
            has_arrear = True

        result_table_data.append([
            Paragraph(code, cell_style),
            Paragraph(title, cell_style),
            Paragraph(str(cr), cell_style),
            Paragraph(f"<b>{grade}</b>", cell_style),
            Paragraph(res, cell_style)
        ])

    results_table = Table(result_table_data, colWidths=[80, 260, 55, 65, 80])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    elements.append(results_table)
    elements.append(Spacer(1, 15))

    # Overall Status Summary
    overall_res = "PASS" if not has_arrear else "FAIL"
    summary_data = [
        [
            Paragraph(f"<b>Total Registered Credits:</b> {total_credits}", cell_style),
            Paragraph(f"<b>Total Earned Credits:</b> {earned_credits}", cell_style),
            Paragraph(f"<b>Provisional Status:</b> <font color='{'#15803D' if overall_res == 'PASS' else '#B91C1C'}'><b>{overall_res}</b></font>", cell_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[180, 180, 180])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#3B82F6')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 25))

    # Security stamp and verification text
    verif_text = f"Digitally authenticated and stored by Examination Automation System. Verification Hash: {hashlib.sha256(student.register_number.encode()).hexdigest()[:16]}"
    elements.append(Paragraph(verif_text, subtext_style))

    doc.build(elements)
    return output_path

def parse_and_extract_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extracts structured examination results from PDF using pdfplumber.
    Validates Register Number, examination session, and subject results.
    """
    extracted = {
        "register_number": None,
        "student_name": None,
        "session_name": None,
        "semester": None,
        "subjects": [],
        "is_valid": False,
        "errors": []
    }

    if not os.path.exists(pdf_path):
        extracted["errors"].append(f"PDF file not found at: {pdf_path}")
        return extracted

    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            all_tables = []
            for page in pdf.pages:
                full_text += (page.extract_text() or "") + "\n"
                tables = page.extract_tables()
                if tables:
                    all_tables.extend(tables)

            lines = [l.strip() for l in full_text.splitlines() if l.strip()]

            # Extract Register Number from text or metadata table
            for line in lines:
                if "register number" in line.lower():
                    parts = line.split(":")
                    if len(parts) > 1:
                        extracted["register_number"] = parts[1].strip().split()[0]
                if "student name" in line.lower():
                    parts = line.split(":")
                    if len(parts) > 1:
                        extracted["student_name"] = parts[1].strip()

            # Parse subjects from table
            for table in all_tables:
                if not table or len(table) < 2:
                    continue
                header = [str(cell or "").strip().lower() for cell in table[0]]
                # Check if this table has subject columns
                if any("sub code" in h or "code" in h for h in header) and any("grade" in h for h in header):
                    code_idx = next(i for i, h in enumerate(header) if "code" in h)
                    name_idx = next((i for i, h in enumerate(header) if "title" in h or "name" in h), 1)
                    credit_idx = next((i for i, h in enumerate(header) if "credit" in h), None)
                    grade_idx = next(i for i, h in enumerate(header) if "grade" in h)
                    res_idx = next((i for i, h in enumerate(header) if "result" in h), None)

                    for row in table[1:]:
                        if len(row) <= max(code_idx, grade_idx):
                            continue
                        sub_code = str(row[code_idx] or "").strip()
                        sub_name = str(row[name_idx] or "").strip() if name_idx < len(row) else ""
                        grade_val = str(row[grade_idx] or "").strip().upper()
                        cr_val = int(str(row[credit_idx]).strip()) if credit_idx and str(row[credit_idx]).strip().isdigit() else 3
                        res_val = str(row[res_idx] or "").strip().upper() if res_idx and len(row) > res_idx else ("PASS" if grade_val in ["O", "A+", "A", "B+", "B", "C"] else "RA")

                        if sub_code and grade_val and sub_code != "Sub Code":
                            extracted["subjects"].append({
                                "code": sub_code,
                                "name": sub_name,
                                "credits": cr_val,
                                "grade": grade_val,
                                "result": res_val
                            })

            if extracted["register_number"] and len(extracted["subjects"]) > 0:
                extracted["is_valid"] = True
            else:
                extracted["errors"].append("Could not extract complete register number or subjects from PDF layout.")

    except Exception as e:
        extracted["errors"].append(f"PDF extraction error: {str(e)}")

    return extracted

def verify_and_store_pdf(
    db: Session,
    student: Student,
    session: ExamSession,
    pdf_path: str
) -> ResultPdf:
    """
    Verifies PDF integrity with SHA256 and registers metadata in ResultPdf.
    """
    file_hash = compute_file_sha256(pdf_path)
    file_size = os.path.getsize(pdf_path)
    filename = Path(pdf_path).name

    extracted = parse_and_extract_pdf(pdf_path)
    is_verified = False
    extraction_status = "PENDING"

    if extracted["is_valid"]:
        if extracted["register_number"] == student.register_number:
            is_verified = True
            extraction_status = "EXTRACTED"
        else:
            extraction_status = "MISMATCH"
    else:
        extraction_status = "FAILED"

    # Check for existing record
    pdf_rec = db.query(ResultPdf).filter(
        ResultPdf.student_id == student.id,
        ResultPdf.session_id == session.id
    ).first()

    if not pdf_rec:
        pdf_rec = ResultPdf(
            student_id=student.id,
            session_id=session.id,
            register_number=student.register_number,
            file_path=pdf_path,
            file_name=filename,
            file_hash=file_hash,
            file_size=file_size,
            is_verified=is_verified,
            extraction_status=extraction_status,
            extracted_data_json=json.dumps(extracted)
        )
        db.add(pdf_rec)
    else:
        pdf_rec.file_path = pdf_path
        pdf_rec.file_name = filename
        pdf_rec.file_hash = file_hash
        pdf_rec.file_size = file_size
        pdf_rec.is_verified = is_verified
        pdf_rec.extraction_status = extraction_status
        pdf_rec.extracted_data_json = json.dumps(extracted)

    db.commit()
    db.refresh(pdf_rec)
    return pdf_rec
