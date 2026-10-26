from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class JobTriggerRequest(BaseModel):
    session_id: int
    department_code: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    student_reg_nos: Optional[List[str]] = None

class JobControlRequest(BaseModel):
    action: str  # "PAUSE", "RESUME", "CANCEL", "RETRY_FAILED"

class AutomationJobLogResponse(BaseModel):
    id: int
    register_number: str
    student_name: Optional[str] = None
    status: str
    stage: str
    message: str
    error_details: Optional[str] = None
    pdf_path: Optional[str] = None
    retry_count: int
    timestamp: datetime

    class Config:
        from_attributes = True

class AutomationJobResponse(BaseModel):
    id: str
    session_id: int
    session_code: Optional[str] = None
    department_code: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    job_type: str
    status: str
    total_records: int
    processed_count: int
    success_count: int
    failed_count: int
    error_summary: Optional[str] = None
    initiated_by: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    logs: List[AutomationJobLogResponse] = []

    class Config:
        from_attributes = True
