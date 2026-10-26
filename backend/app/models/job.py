import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AutomationJob(Base):
    __tablename__ = "automation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    department_code = Column(String(20), nullable=True, index=True)
    batch = Column(String(20), nullable=True)
    semester = Column(Integer, nullable=True)
    job_type = Column(String(50), default="RETRIEVE_AND_VERIFY", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, RUNNING, PAUSED, CANCELLED, COMPLETED, FAILED
    total_records = Column(Integer, default=0, nullable=False)
    processed_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    error_summary = Column(Text, nullable=True)
    initiated_by = Column(String(50), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("ExamSession", back_populates="jobs")
    logs = relationship("AutomationJobLog", back_populates="job", cascade="all, delete-orphan", order_by="AutomationJobLog.id.asc()")

class AutomationJobLog(Base):
    __tablename__ = "automation_job_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(36), ForeignKey("automation_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    register_number = Column(String(20), nullable=False, index=True)
    student_name = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False)  # PENDING, SUCCESS, FAILED, RETRIED, SKIPPED
    stage = Column(String(30), nullable=False)  # FETCH, PDF_GENERATE, PDF_PARSE, VERIFY, STORE
    message = Column(String(255), nullable=False)
    error_details = Column(Text, nullable=True)
    pdf_path = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    job = relationship("AutomationJob", back_populates="logs")
