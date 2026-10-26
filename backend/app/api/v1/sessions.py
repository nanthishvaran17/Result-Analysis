from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.session import ExamSession
from app.schemas.session import ExamSessionCreate, ExamSessionResponse
from app.services.audit_service import log_audit
from app.api.deps import get_current_user, require_roles
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[ExamSessionResponse])
def list_exam_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ExamSession).order_by(ExamSession.id.desc()).all()

@router.post("", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
def create_exam_session(
    session_in: ExamSessionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    existing = db.query(ExamSession).filter(ExamSession.session_code == session_in.session_code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Examination session code already exists.")

    new_session = ExamSession(
        session_code=session_in.session_code.strip().upper(),
        session_name=session_in.session_name.strip(),
        academic_year=session_in.academic_year.strip(),
        semester_type=session_in.semester_type.strip().upper(),
        is_active=True,
        is_locked=False
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="CREATE_SESSION",
        target_entity="ExamSession",
        target_id=new_session.session_code,
        details=f"Created session {new_session.session_name}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return new_session

@router.put("/{session_id}/activate")
def set_active_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Deactivate all others
    db.query(ExamSession).update({ExamSession.is_active: False})
    session_obj.is_active = True
    db.commit()
    db.refresh(session_obj)
    return {"message": f"Session {session_obj.session_code} set as active"}
