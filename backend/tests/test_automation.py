from app.core.database import SessionLocal
from app.services.automation_service import create_automation_job, control_job
from app.models.job import AutomationJob

def test_automation_job_lifecycle():
    db = SessionLocal()
    try:
        job = create_automation_job(
            db=db,
            session_id=1,
            department_code="CSE",
            batch="2022-2026",
            semester=5,
            student_reg_nos=None,
            initiated_by="test_admin"
        )
        assert job.id is not None
        assert job.status == "PENDING"
        assert job.total_records >= 12

        # Control signals
        job_paused = control_job(db, job.id, "PAUSE")
        assert job_paused.status == "PAUSED"

        job_resumed = control_job(db, job.id, "RESUME")
        assert job_resumed.status == "RUNNING"

        job_cancelled = control_job(db, job.id, "CANCEL")
        assert job_cancelled.status == "CANCELLED"
    finally:
        db.close()
