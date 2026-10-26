from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # CSE, ECE, MECH, IT
    name = Column(String(100), nullable=False)

    students = relationship("Student", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    register_number = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    department_code = Column(String(20), ForeignKey("departments.code", onupdate="CASCADE"), nullable=False, index=True)
    batch = Column(String(20), nullable=False, index=True)  # e.g., 2022-2026
    current_semester = Column(Integer, nullable=False)  # 1 to 8
    section = Column(String(5), default="A", nullable=False)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    department = relationship("Department", back_populates="students")
    results = relationship("StudentResult", back_populates="student", cascade="all, delete-orphan")
    pdfs = relationship("ResultPdf", back_populates="student", cascade="all, delete-orphan")
