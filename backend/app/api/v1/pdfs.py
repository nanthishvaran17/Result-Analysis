import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.pdf_record import ResultPdf
from app.models.student import Student
from app.services.audit_service import log_audit
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("", response_model=dict)
def list_pdfs(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ResultPdf).join(Student, ResultPdf.student_id == Student.id)
    if search:
        s_fmt = f"%{search.strip()}%"
        query = query.filter(
            ResultPdf.register_number.ilike(s_fmt) | Student.name.ilike(s_fmt)
        )
    if status:
        query = query.filter(ResultPdf.extraction_status == status.upper())

    total = query.count()
    skip = (page - 1) * limit
    pdfs = query.order_by(ResultPdf.id.desc()).offset(skip).limit(limit).all()

    items = []
    for p in pdfs:
        items.append({
            "id": p.id,
            "student_id": p.student_id,
            "student_name": p.student.name if p.student else "Unknown",
            "register_number": p.register_number,
            "session_id": p.session_id,
            "file_name": p.file_name,
            "file_size": p.file_size,
            "file_hash": p.file_hash,
            "is_verified": p.is_verified,
            "extraction_status": p.extraction_status,
            "created_at": p.created_at
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{pdf_id}/download")
def download_pdf(
    pdf_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pdf = db.query(ResultPdf).filter(ResultPdf.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF record not found")

    file_path = Path(pdf.file_path).resolve()
    # Security: Path traversal protection
    storage_root = settings.PDF_DIR.resolve()
    if not str(file_path).startswith(str(storage_root)):
        raise HTTPException(status_code=403, detail="Forbidden file access")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical PDF file missing from storage")

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="DOWNLOAD_PDF",
        target_entity="ResultPdf",
        target_id=str(pdf.id),
        details=f"Downloaded mark sheet PDF for {pdf.register_number}",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=pdf.file_name
    )
