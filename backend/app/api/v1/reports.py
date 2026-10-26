from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.excel_report import ExcelReport
from app.models.session import ExamSession
from app.schemas.report import GenerateReportRequest, ExcelReportResponse
from app.services.excel_service import generate_enterprise_excel_report
from app.services.audit_service import log_audit
from app.api.deps import get_current_user, require_roles
from app.models.user import User

router = APIRouter()

@router.post("/generate", response_model=ExcelReportResponse)
def create_excel_report(
    req: GenerateReportRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    session_obj = db.query(ExamSession).filter(ExamSession.id == req.session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Examination session not found")

    report = generate_enterprise_excel_report(
        db=db,
        session_id=req.session_id,
        department_code=req.department_code,
        batch=req.batch,
        semester=req.semester,
        generated_by=current_user.username
    )

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="GENERATE_EXCEL_REPORT",
        target_entity="ExcelReport",
        target_id=str(report.id),
        details=f"Generated Excel report '{report.report_name}' for session {session_obj.session_code}",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return report

@router.get("", response_model=List[ExcelReportResponse])
def list_reports(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(ExcelReport).order_by(ExcelReport.id.desc()).limit(limit).all()
    res = []
    for r in reports:
        res.append(
            ExcelReportResponse(
                id=r.id,
                session_id=r.session_id,
                session_code=r.session.session_code if r.session else None,
                department_code=r.department_code,
                batch=r.batch,
                semester=r.semester,
                report_name=r.report_name,
                file_size=r.file_size,
                total_students=r.total_students,
                total_subjects=r.total_subjects,
                pass_percentage=r.pass_percentage,
                is_valid=r.is_valid,
                validation_notes=r.validation_notes,
                generated_by=r.generated_by,
                created_at=r.created_at
            )
        )
    return res

@router.get("/{report_id}/download")
def download_excel_report(
    report_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(ExcelReport).filter(ExcelReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Excel report not found")

    file_path = Path(report.file_path).resolve()
    # Security: Path traversal protection
    storage_root = settings.REPORTS_DIR.resolve()
    if not str(file_path).startswith(str(storage_root)):
        raise HTTPException(status_code=403, detail="Forbidden file access")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical Excel file missing from storage")

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="DOWNLOAD_EXCEL_REPORT",
        target_entity="ExcelReport",
        target_id=str(report.id),
        details=f"Downloaded report '{report.report_name}'",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=report.report_name
    )
