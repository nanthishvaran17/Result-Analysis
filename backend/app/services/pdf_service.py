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

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Times-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        alignment=1  # Center
    )
    inst_sub_style = ParagraphStyle(
        'InstSub',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155'),
        alignment=1
    )
    inst_address_style = ParagraphStyle(
        'InstAddress',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1
    )
    subtext_style = ParagraphStyle(
        'DocSubText',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        alignment=1
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=11
    )
    cell_center_style = ParagraphStyle(
        'CellCenterText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=11,
        alignment=1
    )
    header_cell_style = ParagraphStyle(
        'HeaderCellText',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=1
    )
    header_left_style = ParagraphStyle(
        'HeaderLeftText',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        alignment=1
    )
    hash_style = ParagraphStyle(
        'HashText',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
        alignment=1
    )

    elements = []

    # Institution Header — Official Nandha Autonomous Format
    elements.append(Paragraph(settings.INSTITUTION_NAME.upper(), title_style))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph("(An Autonomous Institution • Affiliated to Anna University, Chennai)", inst_sub_style))
    elements.append(Paragraph("Approved by AICTE, New Delhi • Accredited by NAAC with 'A+' Grade • Erode – 638 052, Tamil Nadu", inst_address_style))
    elements.append(Spacer(1, 5))

    # Divider Table
    div_table = Table([[""]], colWidths=[540], rowHeights=[2])
    div_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 1.5, colors.HexColor('#0F172A')),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(div_table)
    elements.append(Spacer(1, 4))

    elements.append(Paragraph("OFFICE OF THE CONTROLLER OF EXAMINATIONS", subtitle_style))
    elements.append(Paragraph("PROVISIONAL STATEMENT OF GRADES / RESULT NOTIFICATION", subtext_style))
    elements.append(Spacer(1, 10))

    # Student & Exam Metadata Table
    dept_display = f"B.E. – {student.department_code}" if not student.department_code.startswith("B.") else student.department_code
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
            Paragraph("<b>Degree & Branch:</b>", cell_style),
            Paragraph(dept_display, cell_style),
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

    meta_table = Table(meta_data, colWidths=[105, 165, 120, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0F172A')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # Subject Results Table
    result_table_data = [
        [
            Paragraph("<b>S.No</b>", header_cell_style),
            Paragraph("<b>Course Code</b>", header_cell_style),
            Paragraph("<b>Course Title</b>", header_left_style),
            Paragraph("<b>Credits</b>", header_cell_style),
            Paragraph("<b>Grade</b>", header_cell_style),
            Paragraph("<b>Result</b>", header_cell_style)
        ]
    ]

    total_credits = 0
    earned_credits = 0
    has_arrear = False

    for idx, sub in enumerate(subject_results, 1):
        code = str(sub.get("code", "")).strip()
        title = str(sub.get("name", sub.get("title", ""))).strip()
        cr = int(sub.get("credits", 3))
        grade = str(sub.get("grade", "")).strip().upper()
        res = str(sub.get("result", "")).strip().upper()
        if not res:
            res = "PASS" if grade in ["O", "A+", "A", "B+", "B", "C+", "C", "VG", "G", "SF"] else "RA"

        if cr > 0:
            total_credits += cr
            if res == "PASS":
                earned_credits += cr
            else:
                has_arrear = True
        elif res != "PASS":
            has_arrear = True

        # Color-coded Grade and Result text
        if grade in ["RA", "SA", "AB", "W"] or res == "RA":
            grade_para = Paragraph(f"<font color='#B91C1C'><b>{grade}</b></font>", cell_center_style)
            res_para = Paragraph(f"<font color='#B91C1C'><b>{res}</b></font>", cell_center_style)
        else:
            grade_para = Paragraph(f"<font color='#15803D'><b>{grade}</b></font>", cell_center_style)
            res_para = Paragraph(f"<font color='#15803D'><b>{res}</b></font>", cell_center_style)

        result_table_data.append([
            Paragraph(str(idx), cell_center_style),
            Paragraph(code, cell_center_style),
            Paragraph(title, cell_style),
            Paragraph(str(cr), cell_center_style),
            grade_para,
            res_para
        ])

    results_table = Table(result_table_data, colWidths=[35, 75, 250, 50, 60, 70])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0F172A')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#94A3B8')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    elements.append(results_table)
    elements.append(Spacer(1, 10))

    # Overall Status Summary Table
    overall_res = "PASS" if not has_arrear else "FAIL"
    res_color = '#15803D' if overall_res == 'PASS' else '#B91C1C'

    summary_data = [
        [
            Paragraph(f"<b>Credits Registered:</b> {total_credits}", cell_style),
            Paragraph(f"<b>Credits Earned:</b> {earned_credits}", cell_style),
            Paragraph(f"<b>Provisional Status:</b> <font color='{res_color}'><b>{overall_res}</b></font>", cell_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[180, 180, 180])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#0F172A')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 28))

    # Official Seal & Formal Signatures Block
    seal_markup = (
        "<font size='7' color='#0F172A'><b>★ OFFICE OF THE CONTROLLER OF EXAMINATIONS ★</b><br/>"
        "<font size='8' color='#1E3A8A'><b>NANDHA ENGINEERING COLLEGE</b></font><br/>"
        "<font size='6.5' color='#475569'>AUTONOMOUS • ERODE – 638 052<br/>"
        "<b>OFFICIAL SEAL</b></font></font>"
    )
    seal_cell = Paragraph(seal_markup, ParagraphStyle('SealBlock', parent=cell_center_style, leading=9.5))

    left_sign = Paragraph(
        "<br/>___________________________<br/>"
        "<b>Prepared & Verified by</b><br/>"
        "<font size='7.5' color='#64748B'>Office Superintendent</font><br/>"
        f"<font size='7' color='#94A3B8'>Date: {datetime.now(timezone.utc).strftime('%d-%b-%Y')}</font>",
        cell_style
    )

    right_sign = Paragraph(
        "<br/>___________________________<br/>"
        "<b>Controller of Examinations</b><br/>"
        "<font size='7.5' color='#64748B'>Nandha Engineering College (Autonomous)</font><br/>"
        f"<font size='7' color='#94A3B8'>COE Publication Wing</font>",
        ParagraphStyle('SigRight', parent=cell_style, alignment=2)
    )

    sig_data = [[left_sign, seal_cell, right_sign]]
    sig_table = Table(sig_data, colWidths=[180, 180, 180])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Official Embossed Seal Border in Center
        ('BOX', (1, 0), (1, 0), 1.5, colors.HexColor('#1E3A8A')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (1, 0), (1, 0), 6),
        ('BOTTOMPADDING', (1, 0), (1, 0), 6),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('RIGHTPADDING', (1, 0), (1, 0), 8),
        ('TOPPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (2, 0), (2, 0), 0),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 14))

    # Security stamp and verification text
    verif_hash = hashlib.sha256(student.register_number.encode()).hexdigest()[:16].upper()
    elements.append(Paragraph(
        "<b>Disclaimer:</b> This provisional statement of marks is issued under the authority of the Controller of Examinations for immediate information to the examinees. The final Grade Sheet will be issued separately.",
        disclaimer_style
    ))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph(
        f"Digitally Authenticated by Autonomous Examination System • Verification Hash: {verif_hash}",
        hash_style
    ))

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
