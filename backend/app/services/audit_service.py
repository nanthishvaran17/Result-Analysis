from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit(
    db: Session,
    username: str,
    action: str,
    target_entity: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS",
    user_id: Optional[int] = None
) -> AuditLog:
    log_entry = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        target_entity=target_entity,
        target_id=str(target_id) if target_id is not None else None,
        details=details,
        ip_address=ip_address,
        status=status
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
