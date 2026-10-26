import io
from typing import Optional, List, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.student import Student, Department
from app.schemas.student import StudentCreate, StudentUpdate, StudentImportSummary, StudentImportErrorItem

def get_students(
    db: Session,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[Student], int]:
    query = db.query(Student)
    if department_code:
        query = query.filter(Student.department_code == department_code)
    if batch:
        query = query.filter(Student.batch == batch)
    if semester:
        query = query.filter(Student.current_semester == semester)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.register_number.ilike(search_fmt),
                Student.name.ilike(search_fmt),
                Student.email.ilike(search_fmt)
            )
        )
    total = query.count()
    students = query.order_by(Student.register_number.asc()).offset(skip).limit(limit).all()
    return students, total

def get_student_by_id(db: Session, student_id: int) -> Optional[Student]:
    return db.query(Student).filter(Student.id == student_id).first()

def get_student_by_reg_no(db: Session, reg_no: str) -> Optional[Student]:
    return db.query(Student).filter(Student.register_number == reg_no.strip()).first()

def create_student(db: Session, student_in: StudentCreate) -> Student:
    reg_no = student_in.register_number.strip().upper()
    existing = get_student_by_reg_no(db, reg_no)
    if existing:
        raise ValueError(f"Student with Register Number {reg_no} already exists.")
    
    # Ensure department exists
    dept = db.query(Department).filter(Department.code == student_in.department_code.upper()).first()
    if not dept:
        dept = Department(code=student_in.department_code.upper(), name=f"Dept of {student_in.department_code.upper()}")
        db.add(dept)
        db.flush()

    student = Student(
        register_number=reg_no,
        name=student_in.name.strip(),
        department_code=student_in.department_code.upper(),
        batch=student_in.batch.strip(),
        current_semester=student_in.current_semester,
        section=student_in.section.strip().upper() if student_in.section else "A",
        email=student_in.email,
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

def update_student(db: Session, student_id: int, student_in: StudentUpdate) -> Optional[Student]:
    student = get_student_by_id(db, student_id)
    if not student:
        return None
    if student_in.name is not None:
        student.name = student_in.name.strip()
    if student_in.department_code is not None:
        student.department_code = student_in.department_code.upper()
    if student_in.batch is not None:
        student.batch = student_in.batch.strip()
    if student_in.current_semester is not None:
        student.current_semester = student_in.current_semester
    if student_in.section is not None:
        student.section = student_in.section.strip().upper()
    if student_in.email is not None:
        student.email = student_in.email
    if student_in.is_active is not None:
        student.is_active = student_in.is_active
    db.commit()
    db.refresh(student)
    return student

def import_students_from_file(db: Session, file_contents: bytes, filename: str) -> StudentImportSummary:
    summary = StudentImportSummary(
        total_rows=0,
        imported_count=0,
        duplicate_count=0,
        error_count=0,
        errors=[]
    )
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_contents), dtype=str)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_contents), dtype=str)
        else:
            raise ValueError("Unsupported file format. Please upload CSV or Excel (.xlsx, .xls) file.")
    except Exception as e:
        summary.error_count += 1
        summary.errors.append(StudentImportErrorItem(row=0, error=f"File parsing error: {str(e)}"))
        return summary

    # Normalize column names: strip whitespace and lowercase
    col_map = {col: col.strip().lower().replace(" ", "_") for col in df.columns}
    df.rename(columns=col_map, inplace=True)

    required_cols = ["register_number", "name", "department"]
    missing = [c for c in required_cols if not any(c in col for col in df.columns)]
    
    # Try alternate column names if standard not found
    reg_col = next((c for c in df.columns if "reg" in c or "roll" in c), None)
    name_col = next((c for c in df.columns if "name" in c or "student" in c), None)
    dept_col = next((c for c in df.columns if "dept" in c or "branch" in c or "department" in c), None)
    batch_col = next((c for c in df.columns if "batch" in c or "year" in c), None)
    sem_col = next((c for c in df.columns if "sem" in c), None)
    sec_col = next((c for c in df.columns if "sec" in c), None)
    email_col = next((c for c in df.columns if "email" in c or "mail" in c), None)

    if not reg_col or not name_col or not dept_col:
        summary.error_count += 1
        summary.errors.append(StudentImportErrorItem(
            row=0,
            error=f"Missing required columns. Required at least: Register Number, Name, Department. Found: {list(df.columns)}"
        ))
        return summary

    summary.total_rows = len(df)
    existing_reg_nos = {r[0] for r in db.query(Student.register_number).all()}
    departments_cache = {d.code: d for d in db.query(Department).all()}

    new_students = []
    
    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed header + row
        reg_val = str(row[reg_col]).strip().upper() if pd.notna(row[reg_col]) else ""
        name_val = str(row[name_col]).strip() if pd.notna(row[name_col]) else ""
        dept_val = str(row[dept_col]).strip().upper() if pd.notna(row[dept_col]) else "CSE"
        batch_val = str(row[batch_col]).strip() if batch_col and pd.notna(row[batch_col]) else "2022-2026"
        sem_val = int(row[sem_col]) if sem_col and pd.notna(row[sem_col]) and str(row[sem_col]).strip().isdigit() else 5
        sec_val = str(row[sec_col]).strip().upper() if sec_col and pd.notna(row[sec_col]) else "A"
        email_val = str(row[email_col]).strip() if email_col and pd.notna(row[email_col]) else None

        if not reg_val or reg_val == "NAN":
            summary.error_count += 1
            summary.errors.append(StudentImportErrorItem(row=row_num, register_number=reg_val, error="Register Number is empty"))
            continue

        if reg_val in existing_reg_nos:
            summary.duplicate_count += 1
            summary.errors.append(StudentImportErrorItem(row=row_num, register_number=reg_val, error="Duplicate Register Number already registered"))
            continue

        if not name_val or name_val == "NAN":
            summary.error_count += 1
            summary.errors.append(StudentImportErrorItem(row=row_num, register_number=reg_val, error="Student name is missing"))
            continue

        # Ensure department exists in cache / DB
        if dept_val not in departments_cache:
            dept_obj = Department(code=dept_val, name=f"Department of {dept_val}")
            db.add(dept_obj)
            db.flush()
            departments_cache[dept_val] = dept_obj

        student = Student(
            register_number=reg_val,
            name=name_val,
            department_code=dept_val,
            batch=batch_val,
            current_semester=sem_val,
            section=sec_val,
            email=email_val,
            is_active=True
        )
        new_students.append(student)
        existing_reg_nos.add(reg_val)
        summary.imported_count += 1

    if new_students:
        db.add_all(new_students)
        db.commit()

    return summary
