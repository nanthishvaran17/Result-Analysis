from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    register_number: str
    name: str
    department_code: str
    batch: str
    current_semester: int
    section: str = "A"
    dob: Optional[str] = None
    email: Optional[EmailStr] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    department_code: Optional[str] = None
    batch: Optional[str] = None
    current_semester: Optional[int] = None
    section: Optional[str] = None
    dob: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StudentImportErrorItem(BaseModel):
    row: int
    register_number: Optional[str] = None
    error: str

class StudentImportSummary(BaseModel):
    total_rows: int
    imported_count: int
    duplicate_count: int
    error_count: int
    errors: List[StudentImportErrorItem] = []
