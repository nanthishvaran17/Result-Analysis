from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.automation import (
    JobTriggerRequest, JobControlRequest, AutomationJobResponse, AutomationJobLogResponse
)
from app.services.automation_service import create_automation_job, control_job, run_automation_worker
from app.services.audit_service import log_audit
from app.models.job import AutomationJob, AutomationJobLog
from app.models.session import ExamSession
from app.api.deps import get_current_user, require_roles
from app.models.user import User

router = APIRouter()

@router.post("/jobs", response_model=AutomationJobResponse)
def trigger_automation_job(
    req: JobTriggerRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    session_obj = db.query(ExamSession).filter(ExamSession.id == req.session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Examination session not found")

    job = create_automation_job(
        db=db,
        session_id=req.session_id,
        department_code=req.department_code,
        batch=req.batch,
        semester=req.semester,
        student_reg_nos=req.student_reg_nos,
        initiated_by=current_user.username
    )

    if job.total_records == 0:
        job.status = "COMPLETED"
        job.error_summary = "No eligible students found matching the selected filters."
        db.commit()
    else:
        # Launch background task
        background_tasks.add_task(run_automation_worker, job.id)

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="TRIGGER_AUTOMATION",
        target_entity="AutomationJob",
        target_id=job.id,
        details=f"Triggered result automation for {job.total_records} students in {session_obj.session_code}",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return job

@router.get("/jobs", response_model=List[AutomationJobResponse])
def list_jobs(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(AutomationJob).order_by(AutomationJob.created_at.desc()).limit(limit).all()
    res = []
    for j in jobs:
        res.append(
            AutomationJobResponse(
                id=j.id,
                session_id=j.session_id,
                session_code=j.session.session_code if j.session else None,
                department_code=j.department_code,
                batch=j.batch,
                semester=j.semester,
                job_type=j.job_type,
                status=j.status,
                total_records=j.total_records,
                processed_count=j.processed_count,
                success_count=j.success_count,
                failed_count=j.failed_count,
                error_summary=j.error_summary,
                initiated_by=j.initiated_by,
                started_at=j.started_at,
                completed_at=j.completed_at,
                created_at=j.created_at,
                updated_at=j.updated_at,
                logs=[]
            )
        )
    return res

@router.get("/jobs/{job_id}", response_model=AutomationJobResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = db.query(AutomationJobLog).filter(AutomationJobLog.job_id == job_id).order_by(AutomationJobLog.id.desc()).limit(100).all()
    log_responses = [AutomationJobLogResponse.model_validate(l) for l in reversed(logs)]

    return AutomationJobResponse(
        id=job.id,
        session_id=job.session_id,
        session_code=job.session.session_code if job.session else None,
        department_code=job.department_code,
        batch=job.batch,
        semester=job.semester,
        job_type=job.job_type,
        status=job.status,
        total_records=job.total_records,
        processed_count=job.processed_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        error_summary=job.error_summary,
        initiated_by=job.initiated_by,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
        logs=log_responses
    )

@router.post("/jobs/{job_id}/control")
def control_automation_job(
    job_id: str,
    req: JobControlRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    job = control_job(db, job_id, req.action)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if req.action.upper() in ["RESUME", "RETRY_FAILED"]:
        background_tasks.add_task(run_automation_worker, job.id)

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action=f"JOB_CONTROL_{req.action.upper()}",
        target_entity="AutomationJob",
        target_id=job.id,
        details=f"Sent signal {req.action} to job {job.id}",
        ip_address=client_ip,
        user_id=current_user.id
    )

    return {"message": f"Job status updated to {job.status}", "status": job.status}
