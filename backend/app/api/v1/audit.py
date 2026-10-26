from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.api.deps import require_roles
from app.models.user import User

router = APIRouter()

@router.get("", response_model=dict)
def list_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username.strip()}%"))

    total = query.count()
    skip = (page - 1) * limit
    logs = query.order_by(AuditLog.id.desc()).offset(skip).limit(limit).all()

    return {
        "items": [AuditLogResponse.model_validate(l) for l in logs],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }
