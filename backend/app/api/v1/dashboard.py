import shutil
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.config import settings
from app.models.student import Student
from app.models.result import StudentResult
from app.models.pdf_record import ResultPdf
from app.models.session import ExamSession
from app.models.excel_report import ExcelReport
from app.models.audit import AuditLog
from app.models.job import AutomationJob
from app.schemas.dashboard import DashboardStats, ActivityItem
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_students = db.query(Student).filter(Student.is_active == True).count()
    
    # Latest examination session
    latest_session = db.query(ExamSession).filter(ExamSession.is_active == True).order_by(ExamSession.id.desc()).first()
    if not latest_session:
        latest_session = db.query(ExamSession).order_by(ExamSession.id.desc()).first()

    session_id = latest_session.id if latest_session else None
    session_code = latest_session.session_code if latest_session else "N/A"

    results_query = db.query(StudentResult)
    if session_id:
        results_query = results_query.filter(StudentResult.session_id == session_id)

    results_retrieved = results_query.count()
    results_verified = results_query.filter(StudentResult.is_verified == True).count()
    failed_records = results_query.filter(StudentResult.result_status == "FAIL").count()

    pending_records = max(0, total_students - results_retrieved)
    
    missing_ambiguous = (
        db.query(ResultPdf)
        .filter(ResultPdf.extraction_status.in_(["FAILED", "MISMATCH"]))
        .count()
    )

    # Recent Audit Log Activity
    recent_logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(8).all()
    recent_activities = [
        ActivityItem(
            id=log.id,
            action=log.action,
            username=log.username,
            target=log.target_entity or log.details,
            status=log.status,
            timestamp=log.timestamp
        )
        for log in recent_logs
    ]

    # Latest Excel export
    latest_report = (
        db.query(ExcelReport)
        .filter(ExcelReport.is_valid == True)
        .order_by(ExcelReport.id.desc())
        .first()
    )
    latest_export_data = None
    if latest_report:
        latest_export_data = {
            "id": latest_report.id,
            "report_name": latest_report.report_name,
            "created_at": latest_report.created_at.isoformat(),
            "pass_percentage": latest_report.pass_percentage,
            "total_students": latest_report.total_students,
            "generated_by": latest_report.generated_by
        }

    # System Health
    disk_total, disk_used, disk_free = shutil.disk_usage(settings.BASE_DIR)
    active_jobs = db.query(AutomationJob).filter(AutomationJob.status == "RUNNING").count()

    system_health = {
        "status": "OPERATIONAL",
        "database": "CONNECTED",
        "storage_free_gb": round(disk_free / (2**30), 2),
        "active_background_jobs": active_jobs,
        "pdf_storage_dir": str(settings.PDF_DIR),
        "reports_storage_dir": str(settings.REPORTS_DIR)
    }

    return DashboardStats(
        total_eligible_students=total_students,
        results_retrieved=results_retrieved,
        results_verified=results_verified,
        pending_records=pending_records,
        failed_records=failed_records,
        missing_ambiguous_results=missing_ambiguous,
        latest_session=session_code,
        latest_session_id=session_id,
        recent_activities=recent_activities,
        latest_excel_export=latest_export_data,
        system_health=system_health
    )
