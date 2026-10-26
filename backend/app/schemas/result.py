from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class SubjectResultItem(BaseModel):
    subject_code: str
    subject_name: str
    credits: int
    grade: str
    result_status: str
    internal_marks: Optional[int] = None
    external_marks: Optional[int] = None
    total_marks: Optional[int] = None
    is_arrear: bool

class StudentResultResponse(BaseModel):
    id: int
    student_id: int
    register_number: str
    student_name: str
    department_code: str
    batch: str
    session_id: int
    session_code: str
    semester: int
    total_credits: int
    earned_credits: int
    gpa: float
    result_status: str
    arrears_count: int
    standing_arrears_count: int
    is_verified: bool
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    subject_results: List[SubjectResultItem] = []

    class Config:
        from_attributes = True

class SubjectColumnHeader(BaseModel):
    code: str
    name: str
    credits: int

class StudentMatrixRow(BaseModel):
    student_id: int
    register_number: str
    student_name: str
    department_code: str
    batch: str
    semester: int
    grades: Dict[str, str]  # subject_code -> grade (e.g. "CS3351": "A+")
    subject_statuses: Dict[str, str]  # subject_code -> "PASS" / "RA"
    gpa: float
    result_status: str  # PASS / FAIL
    arrears_count: int
    standing_arrears_count: int
    is_verified: bool

class ResultMatrixResponse(BaseModel):
    session_code: str
    department_code: Optional[str] = None
    columns: List[SubjectColumnHeader]
    rows: List[StudentMatrixRow]
    total_students: int
    passed_students: int
    failed_students: int
    pass_percentage: float
    average_gpa: float
