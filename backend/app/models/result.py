from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudentResult(Base):
    __tablename__ = "student_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, nullable=False, index=True)
    total_credits = Column(Integer, default=0, nullable=False)
    earned_credits = Column(Integer, default=0, nullable=False)
    gpa = Column(Float, default=0.0, nullable=False)
    result_status = Column(String(20), default="PENDING", nullable=False)  # PASS, FAIL, WITHHELD, PENDING
    arrears_count = Column(Integer, default=0, nullable=False)
    standing_arrears_count = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "session_id", "semester", name="uq_student_session_semester"),
    )

    student = relationship("Student", back_populates="results")
    session = relationship("ExamSession", back_populates="results")
    subject_results = relationship("SubjectResult", back_populates="student_result", cascade="all, delete-orphan")

class SubjectResult(Base):
    __tablename__ = "subject_results"

    id = Column(Integer, primary_key=True, index=True)
    student_result_id = Column(Integer, ForeignKey("student_results.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    grade = Column(String(5), nullable=False)  # O, A+, A, B+, B, C, RA, SA, W, AB
    result_status = Column(String(10), nullable=False)  # PASS, RA, AB, W
    internal_marks = Column(Integer, nullable=True)
    external_marks = Column(Integer, nullable=True)
    total_marks = Column(Integer, nullable=True)
    credits = Column(Integer, default=3, nullable=False)
    is_arrear = Column(Boolean, default=False, nullable=False)
    attempt_number = Column(Integer, default=1, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_result_id", "subject_id", name="uq_student_result_subject"),
    )

    student_result = relationship("StudentResult", back_populates="subject_results")
    subject = relationship("Subject", back_populates="subject_results")
