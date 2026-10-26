from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResultPdf(Base):
    __tablename__ = "result_pdfs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    register_number = Column(String(20), nullable=False, index=True)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(100), nullable=False)
    file_hash = Column(String(64), nullable=False)  # SHA-256
    file_size = Column(Integer, nullable=False)  # in bytes
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    extraction_status = Column(String(30), default="PENDING", nullable=False)  # PENDING, EXTRACTED, FAILED, MISMATCH
    extracted_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="uq_pdf_student_session"),
    )

    student = relationship("Student", back_populates="pdfs")
