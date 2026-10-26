import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.student import Department, Student
from app.models.session import ExamSession
from app.models.subject import Subject
from app.models.result import StudentResult
from app.core.security import get_password_hash
from app.services.automation_service import process_single_student, create_automation_job

def run_seed():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Staff Users
        if db.query(User).count() == 0:
            print("Seeding initial staff users...")
            users = [
                User(
                    username="admin",
                    email="admin@college.edu",
                    hashed_password=get_password_hash("AdminPassword123!"),
                    full_name="Chief Controller of Examinations",
                    role="ADMIN",
                    is_active=True
                ),
                User(
                    username="exam_officer",
                    email="officer@college.edu",
                    hashed_password=get_password_hash("OfficerPass123!"),
                    full_name="Senior Examination Officer",
                    role="EXAM_STAFF",
                    is_active=True
                ),
                User(
                    username="faculty_viewer",
                    email="faculty@college.edu",
                    hashed_password=get_password_hash("ViewerPass123!"),
                    full_name="Academic Department Observer",
                    role="VIEWER",
                    is_active=True
                )
            ]
            db.add_all(users)
            db.commit()

        # 2. Departments
        if db.query(Department).count() == 0:
            print("Seeding academic departments...")
            depts = [
                Department(code="CSE", name="Computer Science and Engineering"),
                Department(code="ECE", name="Electronics and Communication Engineering"),
                Department(code="MECH", name="Mechanical Engineering"),
                Department(code="IT", name="Information Technology")
            ]
            db.add_all(depts)
            db.commit()

        # 3. Examination Sessions
        if db.query(ExamSession).count() == 0:
            print("Seeding examination sessions...")
            sessions = [
                ExamSession(
                    session_code="NOV_DEC_2025",
                    session_name="Nov/Dec 2025 End Semester Examinations",
                    academic_year="2025-2026",
                    semester_type="ODD",
                    is_active=True,
                    is_locked=False
                ),
                ExamSession(
                    session_code="APR_MAY_2025",
                    session_name="Apr/May 2025 End Semester Examinations",
                    academic_year="2024-2025",
                    semester_type="EVEN",
                    is_active=False,
                    is_locked=True
                )
            ]
            db.add_all(sessions)
            db.commit()

        # 4. Subjects
        if db.query(Subject).count() == 0:
            print("Seeding course syllabus & subjects...")
            subjects = [
                Subject(code="CS3591", name="Computer Networks", department_code="CSE", semester=5, credits=4),
                Subject(code="CS3501", name="Compiler Design", department_code="CSE", semester=5, credits=4),
                Subject(code="CB3491", name="Cryptography and Cyber Security", department_code="CSE", semester=5, credits=3),
                Subject(code="CS3551", name="Distributed Computing", department_code="CSE", semester=5, credits=3),
                Subject(code="CCS375", name="Cloud Computing", department_code="CSE", semester=5, credits=3),
                Subject(code="CS3511", name="Networks and Security Laboratory", department_code="CSE", semester=5, credits=2),
                
                # ECE
                Subject(code="EC3501", name="Digital Signal Processing", department_code="ECE", semester=5, credits=4),
                Subject(code="EC3551", name="Transmission Lines and Waveguides", department_code="ECE", semester=5, credits=3),
                Subject(code="EC3511", name="Signal Processing Laboratory", department_code="ECE", semester=5, credits=2)
            ]
            db.add_all(subjects)
            db.commit()

        # 5. Students
        if db.query(Student).count() == 0:
            print("Seeding student cohort...")
            cse_names = [
                ("Aakash R", "710022104001"), ("Ananya S", "710022104002"),
                ("Balamurugan K", "710022104003"), ("Charulata M", "710022104004"),
                ("Dinesh Kumar P", "710022104005"), ("Divya Bharathi V", "710022104006"),
                ("Gokulnath T", "710022104007"), ("Harini Devi R", "710022104008"),
                ("Jeyasurya S", "710022104009"), ("Karthick Raja M", "710022104010"),
                ("Keerthana N", "710022104011"), ("Manikandan K", "710022104012"),
                ("Naveen Kumar A", "710022104013"), ("Nithya Shree S", "710022104014"),
                ("Pavithra M", "710022104015"), ("Pradeep Raj E", "710022104016"),
                ("Raghavan G", "710022104017"), ("Sangeetha B", "710022104018"),
                ("Saravanan V", "710022104019"), ("Vigneshwaran P", "710022104020")
            ]
            student_objs = []
            for name, reg in cse_names:
                s = Student(
                    register_number=reg,
                    name=name,
                    department_code="CSE",
                    batch="2022-2026",
                    current_semester=5,
                    section="A",
                    email=f"{reg.lower()}@college.edu",
                    is_active=True
                )
                student_objs.append(s)
            db.add_all(student_objs)
            db.commit()

        # 6. Pre-process results for first 12 students so platform starts with real data
        active_sess = db.query(ExamSession).filter(ExamSession.session_code == "NOV_DEC_2025").first()
        subjects_list = db.query(Subject).all()
        target_students = db.query(Student).filter(Student.department_code == "CSE").limit(12).all()

        if db.query(StudentResult).count() == 0 and active_sess and target_students:
            print("Executing initial verification & PDF generation for sample cohort...")
            init_job = create_automation_job(
                db=db,
                session_id=active_sess.id,
                department_code="CSE",
                batch="2022-2026",
                semester=5,
                student_reg_nos=[s.register_number for s in target_students],
                initiated_by="admin"
            )
            init_job.status = "COMPLETED"
            init_job.started_at = datetime.now(timezone.utc)
            init_job.completed_at = datetime.now(timezone.utc)
            db.commit()

            for student in target_students:
                success = process_single_student(db, init_job, student, active_sess, subjects_list)
                init_job.processed_count += 1
                if success:
                    init_job.success_count += 1
                else:
                    init_job.failed_count += 1
            db.commit()

        print("Database seeded successfully with verified real records!")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
