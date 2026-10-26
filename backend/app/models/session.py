from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "NOV_DEC_2025"
    session_name = Column(String(150), nullable=False)  # e.g., "Nov/Dec 2025 End Semester Examinations"
    academic_year = Column(String(20), nullable=False)  # e.g., "2025-2026"
    semester_type = Column(String(10), nullable=False)  # ODD or EVEN
    is_active = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    results = relationship("StudentResult", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("ExcelReport", back_populates="session", cascade="all, delete-orphan")
    jobs = relationship("AutomationJob", back_populates="session", cascade="all, delete-orphan")
