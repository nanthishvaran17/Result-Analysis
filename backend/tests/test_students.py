import uuid
import pytest
from app.core.database import SessionLocal
from app.services.student_service import get_students, create_student, import_students_from_file
from app.schemas.student import StudentCreate
from app.models.student import Student

def test_student_retrieval_and_filtering():
    db = SessionLocal()
    try:
        students, total = get_students(db, department_code="CSE", limit=10)
        assert total >= 12
        assert len(students) <= 10
        assert all(s.department_code == "CSE" for s in students)
    finally:
        db.close()

def test_duplicate_student_prevention():
    db = SessionLocal()
    try:
        student_data = StudentCreate(
            register_number="710022104001",  # Seeded student
            name="Duplicate Test",
            department_code="CSE",
            batch="2022-2026",
            current_semester=5,
            section="A"
        )
        with pytest.raises(ValueError) as exc:
            create_student(db, student_data)
        assert "already exists" in str(exc.value)
    finally:
        db.close()

def test_student_csv_bulk_import():
    db = SessionLocal()
    unique_reg = f"7100{str(uuid.uuid4().int)[:8]}"
    try:
        csv_content = f"register_number,name,department,batch,semester\n{unique_reg},Synthetic Student X,CSE,2022-2026,5\n710022104001,Duplicate Person,CSE,2022-2026,5".encode("utf-8")
        summary = import_students_from_file(db, csv_content, "test_cohort.csv")
        assert summary.total_rows == 2
        assert summary.imported_count == 1
        assert summary.duplicate_count == 1

        # Clean up imported test record
        db.query(Student).filter(Student.register_number == unique_reg).delete()
        db.commit()
    finally:
        db.close()
