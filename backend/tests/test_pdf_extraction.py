import os
from app.core.database import SessionLocal
from app.models.student import Student
from app.models.session import ExamSession
from app.services.pdf_service import generate_marksheet_pdf, parse_and_extract_pdf, compute_file_sha256

def test_pdf_generation_and_extraction():
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.register_number == "710022104001").first()
        session = db.query(ExamSession).filter(ExamSession.session_code == "NOV_DEC_2025").first()
        assert student is not None
        assert session is not None

        subjects = [
            {"code": "CS3591", "name": "Computer Networks", "credits": 4, "grade": "A+"},
            {"code": "CS3501", "name": "Compiler Design", "credits": 4, "grade": "O"}
        ]

        test_pdf_path = "storage/pdfs/test_synthetic_marksheet.pdf"
        generated_path = generate_marksheet_pdf(student, session, subjects, output_path=test_pdf_path)
        assert os.path.exists(generated_path)
        
        file_hash = compute_file_sha256(generated_path)
        assert len(file_hash) == 64

        # Extract and verify
        extracted = parse_and_extract_pdf(generated_path)
        assert extracted["is_valid"] is True
        assert extracted["register_number"] == student.register_number
        assert len(extracted["subjects"]) == 2
        assert extracted["subjects"][0]["code"] == "CS3591"
        assert extracted["subjects"][0]["grade"] == "A+"

        # Clean up test file
        if os.path.exists(test_pdf_path):
            os.remove(test_pdf_path)
    finally:
        db.close()
