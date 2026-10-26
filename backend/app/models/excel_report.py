from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExcelReport(Base):
    __tablename__ = "excel_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    department_code = Column(String(20), nullable=True, index=True)
    batch = Column(String(20), nullable=True)
    semester = Column(Integer, nullable=True)
    report_name = Column(String(150), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_hash = Column(String(64), nullable=False)  # SHA-256
    total_students = Column(Integer, default=0, nullable=False)
    total_subjects = Column(Integer, default=0, nullable=False)
    pass_percentage = Column(Float, default=0.0, nullable=False)
    is_valid = Column(Boolean, default=False, nullable=False)
    validation_notes = Column(Text, nullable=True)
    generated_by = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("ExamSession", back_populates="reports")
