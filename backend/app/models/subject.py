from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., CS3351
    name = Column(String(150), nullable=False)
    department_code = Column(String(20), ForeignKey("departments.code", onupdate="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, nullable=False, index=True)
    credits = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    department = relationship("Department", back_populates="subjects")
    subject_results = relationship("SubjectResult", back_populates="subject")
