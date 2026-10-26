from datetime import datetime
from pydantic import BaseModel

class ExamSessionCreate(BaseModel):
    session_code: str
    session_name: str
    academic_year: str
    semester_type: str = "ODD"

class ExamSessionResponse(BaseModel):
    id: int
    session_code: str
    session_name: str
    academic_year: str
    semester_type: str
    is_active: bool
    is_locked: bool
    created_at: datetime

    class Config:
        from_attributes = True
