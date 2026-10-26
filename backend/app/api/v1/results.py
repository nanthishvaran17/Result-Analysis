from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.result import (
    ResultMatrixResponse, StudentResultResponse,
    RankAndRemedialResponse, SubjectPerformanceResponse
)
from app.services.result_service import (
    get_result_matrix, verify_student_result,
    get_rank_and_remedial_analytics, get_subject_performance_analytics
)
from app.services.audit_service import log_audit
from app.models.result import StudentResult
from app.models.session import ExamSession
from app.api.deps import get_current_user, require_roles
from app.models.user import User

router = APIRouter()

def resolve_session_id(session_id: Optional[int], db: Session) -> int:
    if not session_id:
        active_sess = db.query(ExamSession).filter(ExamSession.is_active == True).order_by(ExamSession.id.desc()).first()
        if not active_sess:
            active_sess = db.query(ExamSession).order_by(ExamSession.id.desc()).first()
        if not active_sess:
            raise HTTPException(status_code=400, detail="No examination sessions found.")
        return active_sess.id
    return session_id

@router.get("/matrix", response_model=ResultMatrixResponse)
def get_matrix(
    session_id: Optional[int] = None,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_id = resolve_session_id(session_id, db)
    return get_result_matrix(
        db=db,
        session_id=session_id,
        department_code=department_code,
        batch=batch,
        semester=semester
    )

@router.get("/analytics/rank-and-remedial", response_model=RankAndRemedialResponse)
def get_rank_and_remedial(
    session_id: Optional[int] = None,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_id = resolve_session_id(session_id, db)
    return get_rank_and_remedial_analytics(
        db=db,
        session_id=session_id,
        department_code=department_code,
        batch=batch,
        semester=semester
    )

@router.get("/analytics/subject-performance", response_model=SubjectPerformanceResponse)
def get_subject_performance(
    session_id: Optional[int] = None,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_id = resolve_session_id(session_id, db)
    return get_subject_performance_analytics(
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

@router.post("/live-fetch")
def live_fetch_coe_result(
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.nandha_service import fetch_live_coe_result, import_or_update_live_result

    reg_no = payload.get("register_number", "").strip().upper()
    dob = payload.get("dob", "").strip()
    session_id = payload.get("session_id")

    if not reg_no or not dob:
        raise HTTPException(status_code=400, detail="Register number and Date of Birth (DD/MM/YYYY) are required.")

    resolved_session_id = resolve_session_id(session_id, db)

    try:
        live_data = fetch_live_coe_result(reg_no, dob)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to communicate with Nandha COE portal: {str(e)}")

    # Import into DB
    res_obj = import_or_update_live_result(db, live_data, resolved_session_id)

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="LIVE_COE_FETCH",
        target_entity="StudentResult",
        target_id=str(res_obj.id),
        details=f"Retrieved live result for {reg_no} from Nandha COE portal",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return {
        "success": True,
        "message": f"Successfully retrieved authentic marksheet for {live_data['student_name']} ({reg_no}) from Nandha COE portal.",
        "student_name": live_data["student_name"],
        "register_number": live_data["register_number"],
        "branch_name": live_data["branch_name"],
        "gpa": live_data["gpa"],
        "total_credits": live_data["total_credits"],
        "earned_credits": live_data["earned_credits"],
        "result_status": live_data["result_status"],
        "arrears_count": live_data["arrears_count"],
        "courses": live_data["courses"],
        "result_id": res_obj.id
    }


@router.get("/nandha-bulk-template")
@router.get("/live-fetch/template")
def download_nandha_bulk_template(current_user: User = Depends(get_current_user)):
    """
    Downloads an official Excel (.xlsx) roster template formatted for bulk syncing
    credentials against the Nandha Engineering College COE portal.
    """
    from app.services.nandha_service import generate_nandha_bulk_template
    buf = generate_nandha_bulk_template()
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Nandha_COE_Bulk_Sync_Template.xlsx"}
    )


@router.post("/nandha-bulk-sync")
@router.post("/live-fetch/bulk")
def bulk_sync_nandha_records(
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    """
    Takes an array of candidate credentials [{"register_number": "...", "dob": "..."}]
    and executes sequential live extraction against the Nandha COE portal.
    """
    from app.services.nandha_service import bulk_sync_nandha_results

    records = payload.get("records", [])
    session_id = payload.get("session_id")

    if not records or not isinstance(records, list):
        raise HTTPException(status_code=400, detail="A non-empty list of candidate records is required.")

    resolved_session_id = resolve_session_id(session_id, db)
    report = bulk_sync_nandha_results(db, records, resolved_session_id)

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="LIVE_COE_BULK_SYNC",
        target_entity="StudentResult",
        target_id=str(resolved_session_id),
        details=f"Processed {report['total_submitted']} candidates ({report['success_count']} success, {report['failed_count']} failed)",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return report


@router.post("/nandha-bulk-upload")
async def upload_nandha_bulk_file(
    file: UploadFile = File(...),
    session_id: Optional[int] = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    """
    Accepts an uploaded Excel (.xlsx) or CSV file with Register Numbers and DOBs,
    parses them, and executes bulk live portal synchronization.
    """
    from app.services.nandha_service import parse_nandha_bulk_file, bulk_sync_nandha_results

    content = await file.read()
    records = parse_nandha_bulk_file(content, file.filename)

    if not records:
        raise HTTPException(
            status_code=400,
            detail="No valid candidate credentials found. Please ensure the file contains 'Register Number' and 'Date of Birth' columns."
        )

    resolved_session_id = resolve_session_id(session_id, db)
    report = bulk_sync_nandha_results(db, records, resolved_session_id)

    client_ip = request.client.host if request and request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="LIVE_COE_BULK_UPLOAD",
        target_entity="StudentResult",
        target_id=str(resolved_session_id),
        details=f"Uploaded {file.filename} with {report['total_submitted']} candidates ({report['success_count']} success, {report['failed_count']} failed)",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return report


