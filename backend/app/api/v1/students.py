from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.student import (
    StudentCreate, StudentUpdate, StudentResponse, DepartmentResponse, StudentImportSummary
)
from app.services.student_service import (
    get_students, get_student_by_id, create_student, update_student, import_students_from_file
)
from app.services.audit_service import log_audit
from app.models.student import Department, Student
from app.api.deps import get_current_user, require_roles
from app.models.user import User

from fastapi.responses import Response

router = APIRouter()

@router.get("/template")
def download_student_template(
    current_user: User = Depends(get_current_user)
):
    from app.services.student_service import generate_roster_template
    output = generate_roster_template()
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Student_Roster_Template.xlsx"}
    )

@router.get("/export")
def export_students(
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.student_service import export_students_excel
    students, _ = get_students(db=db, department_code=department_code, batch=batch, semester=semester, limit=10000)
    output = export_students_excel(students)
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Student_Roster_Export.xlsx"}
    )

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def bulk_add_students(
    students_in: List[StudentCreate],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    from app.services.student_service import bulk_create_students
    res = bulk_create_students(db, students_in)
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="BULK_CREATE_STUDENTS",
        target_entity="StudentRegistry",
        target_id=f"Count: {res['created_count']}",
        details=f"Bulk registered {res['created_count']} students (Skipped {res['skipped_count']})",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return res

@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Department).order_by(Department.code.asc()).all()

@router.get("", response_model=dict)
def list_students(
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * limit
    students, total = get_students(
        db=db,
        department_code=department_code,
        batch=batch,
        semester=semester,
        search=search,
        skip=skip,
        limit=limit
    )
    return {
        "items": [StudentResponse.model_validate(s) for s in students],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def add_student(
    student_in: StudentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    try:
        student = create_student(db, student_in)
        client_ip = request.client.host if request.client else "unknown"
        log_audit(
            db=db,
            username=current_user.username,
            action="CREATE_STUDENT",
            target_entity="Student",
            target_id=student.register_number,
            details=f"Added student {student.name} ({student.department_code})",
            ip_address=client_ip,
            user_id=current_user.id
        )
        return student
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import", response_model=StudentImportSummary)
async def import_students(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    contents = await file.read()
    summary = import_students_from_file(db, contents, file.filename)
    
    client_ip = request.client.host if request and request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="IMPORT_STUDENTS",
        target_entity="StudentRegistry",
        target_id=file.filename,
        details=f"Imported: {summary.imported_count}, Duplicates: {summary.duplicate_count}, Errors: {summary.error_count}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return summary

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def modify_student(
    student_id: int,
    student_in: StudentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "EXAM_STAFF"]))
):
    student = update_student(db, student_id, student_in)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="UPDATE_STUDENT",
        target_entity="Student",
        target_id=student.register_number,
        details=f"Updated details for student {student.register_number}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return student

@router.delete("/{student_id}")
def remove_student(
    student_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    reg_no = student.register_number
    db.delete(student)
    db.commit()
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="DELETE_STUDENT",
        target_entity="Student",
        target_id=reg_no,
        details=f"Removed student record {reg_no}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return {"message": f"Student {reg_no} deleted successfully"}
