from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.result import ResultMatrixResponse, StudentResultResponse
from app.services.result_service import get_result_matrix, verify_student_result
from app.services.audit_service import log_audit
from app.models.result import StudentResult
from app.models.session import ExamSession
from app.api.deps import get_current_user, require_roles
from app.models.user import User

router = APIRouter()

@router.get("/matrix", response_model=ResultMatrixResponse)
def get_matrix(
    session_id: Optional[int] = None,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not session_id:
        active_sess = db.query(ExamSession).filter(ExamSession.is_active == True).order_by(ExamSession.id.desc()).first()
        if not active_sess:
            active_sess = db.query(ExamSession).order_by(ExamSession.id.desc()).first()
        if not active_sess:
            raise HTTPException(status_code=400, detail="No examination sessions found.")
        session_id = active_sess.id

    return get_result_matrix(
        db=db,
        session_id=session_id,
        department_code=department_code,
        batch=batch,
        semester=semester
    )

@router.get("/student/{student_id}", response_model=List[dict])
def get_student_results_history(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(StudentResult).filter(StudentResult.student_id == student_id).all()
    history = []
    for r in results:
        subjects_data = []
        for sr in r.subject_results:
            subjects_data.append({
                "subject_code": sr.subject.code if sr.subject else "N/A",
                "subject_name": sr.subject.name if sr.subject else "N/A",
                "credits": sr.credits,
                "grade": sr.grade,
                "result_status": sr.result_status,
                "is_arrear": sr.is_arrear
            })

        history.append({
            "id": r.id,
            "session_code": r.session.session_code if r.session else "N/A",
            "semester": r.semester,
            "total_credits": r.total_credits,
            "earned_credits": r.earned_credits,
            "gpa": r.gpa,
            "result_status": r.result_status,
            "arrears_count": r.arrears_count,
            "standing_arrears_count": r.standing_arrears_count,
            "is_verified": r.is_verified,
            "verified_at": r.verified_at,
            "verified_by": r.verified_by,
            "subjects": subjects_data
        })
    return history

@router.post("/{result_id}/verify")
def verify_result(
    result_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    res = verify_student_result(db, result_id, verified_by=current_user.username)
    if not res:
        raise HTTPException(status_code=404, detail="Student result not found")
    
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="VERIFY_RESULT",
        target_entity="StudentResult",
        target_id=str(result_id),
        details=f"Verified result for student ID {res.student_id} (GPA: {res.gpa})",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return {"message": "Result verified successfully", "is_verified": True}
