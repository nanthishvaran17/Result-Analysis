from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class GenerateReportRequest(BaseModel):
    session_id: int
    department_code: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None

class ExcelReportResponse(BaseModel):
    id: int
    session_id: int
    session_code: Optional[str] = None
    department_code: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    report_name: str
    file_size: int
    total_students: int
    total_subjects: int
    pass_percentage: float
    is_valid: bool
    validation_notes: Optional[str] = None
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True
