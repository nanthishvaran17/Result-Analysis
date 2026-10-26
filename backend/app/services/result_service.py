from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.result import StudentResult, SubjectResult
from app.models.student import Student
from app.models.subject import Subject
from app.models.session import ExamSession
from app.schemas.result import (
    ResultMatrixResponse, SubjectColumnHeader, StudentMatrixRow, StudentResultResponse, SubjectResultItem
)

GRADE_POINTS: Dict[str, int] = {
    "O": 10,
    "A+": 9,
    "A": 8,
    "B+": 7,
    "B": 6,
    "C": 5,
    "RA": 0,
    "SA": 0,
    "W": 0,
    "AB": 0
}

PASSING_GRADES = {"O", "A+", "A", "B+", "B", "C"}
ARREAR_GRADES = {"RA", "SA", "W", "AB"}

def calculate_gpa_and_status(subject_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministic academic calculation.
    subject_items: list of dicts with keys: 'credits', 'grade'
    """
    total_credits = 0
    earned_credits = 0
    weighted_points = 0.0
    arrears_count = 0
    has_withheld = False

    for item in subject_items:
        grade = str(item.get("grade", "")).strip().upper()
        credits = int(item.get("credits", 3))
        total_credits += credits

        if grade in PASSING_GRADES:
            gp = GRADE_POINTS.get(grade, 0)
            earned_credits += credits
            weighted_points += (gp * credits)
        else:
            arrears_count += 1
            if grade == "W":
                has_withheld = True

    gpa = round(weighted_points / total_credits, 2) if total_credits > 0 else 0.0
    
    if arrears_count == 0:
        result_status = "PASS"
    elif has_withheld and arrears_count == 1:
        result_status = "WITHHELD"
    else:
        result_status = "FAIL"

    return {
        "total_credits": total_credits,
        "earned_credits": earned_credits,
        "gpa": gpa,
        "result_status": result_status,
        "arrears_count": arrears_count
    }

def calculate_standing_arrears(db: Session, student_id: int, current_session_id: int) -> int:
    """
    Calculates historical standing arrears across past sessions for this student.
    A subject previously failed is cleared if passed in a later or current session.
    """
    # Get all subject results for this student up to and including current session
    results = (
        db.query(SubjectResult)
        .join(StudentResult, SubjectResult.student_result_id == StudentResult.id)
        .filter(StudentResult.student_id == student_id)
        .order_by(StudentResult.session_id.asc(), StudentResult.id.asc())
        .all()
    )

    # Track status of each subject
    subject_status_map: Dict[int, str] = {}
    for sr in results:
        subject_status_map[sr.subject_id] = sr.grade

    # Count subjects whose latest status is still an arrear
    uncleared = sum(1 for grade in subject_status_map.values() if grade in ARREAR_GRADES)
    return uncleared

def get_result_matrix(
    db: Session,
    session_id: int,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None
) -> ResultMatrixResponse:
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    session_code = session_obj.session_code if session_obj else f"SESSION_{session_id}"

    # Query all StudentResults for this session
    query = (
        db.query(StudentResult)
        .join(Student, StudentResult.student_id == Student.id)
        .filter(StudentResult.session_id == session_id)
    )

    if department_code:
        query = query.filter(Student.department_code == department_code)
    if batch:
        query = query.filter(Student.batch == batch)
    if semester:
        query = query.filter(StudentResult.semester == semester)

    student_results = query.order_by(Student.register_number.asc()).all()

    # Collect distinct subjects appeared in these results
    subject_map: Dict[int, Subject] = {}
    for sr in student_results:
        for sub_res in sr.subject_results:
            if sub_res.subject_id not in subject_map and sub_res.subject:
                subject_map[sub_res.subject_id] = sub_res.subject

    # Deterministic alphabetical sort by subject code
    sorted_subjects = sorted(subject_map.values(), key=lambda s: s.code)
    columns = [
        SubjectColumnHeader(code=s.code, name=s.name, credits=s.credits)
        for s in sorted_subjects
    ]

    rows: List[StudentMatrixRow] = []
    pass_count = 0
    fail_count = 0
    total_gpa = 0.0

    for sr in student_results:
        grades: Dict[str, str] = {}
        statuses: Dict[str, str] = {}

        for sub_res in sr.subject_results:
            if sub_res.subject:
                grades[sub_res.subject.code] = sub_res.grade
                statuses[sub_res.subject.code] = "PASS" if sub_res.grade in PASSING_GRADES else "RA"

        if sr.result_status == "PASS":
            pass_count += 1
        else:
            fail_count += 1
        total_gpa += sr.gpa

        rows.append(
            StudentMatrixRow(
                student_id=sr.student_id,
                register_number=sr.student.register_number,
                student_name=sr.student.name,
                department_code=sr.student.department_code,
                batch=sr.student.batch,
                semester=sr.semester,
                grades=grades,
                subject_statuses=statuses,
                gpa=sr.gpa,
                result_status=sr.result_status,
                arrears_count=sr.arrears_count,
                standing_arrears_count=sr.standing_arrears_count,
                is_verified=sr.is_verified
            )
        )

    total_students = len(rows)
    pass_pct = round((pass_count / total_students * 100), 2) if total_students > 0 else 0.0
    avg_gpa = round((total_gpa / total_students), 2) if total_students > 0 else 0.0

    return ResultMatrixResponse(
        session_code=session_code,
        department_code=department_code,
        columns=columns,
        rows=rows,
        total_students=total_students,
        passed_students=pass_count,
        failed_students=fail_count,
        pass_percentage=pass_pct,
        average_gpa=avg_gpa
    )

def verify_student_result(db: Session, student_result_id: int, verified_by: str) -> Optional[StudentResult]:
    sr = db.query(StudentResult).filter(StudentResult.id == student_result_id).first()
    if not sr:
        return None
    sr.is_verified = True
    sr.verified_at = datetime.now(timezone.utc)
    sr.verified_by = verified_by
    db.commit()
    db.refresh(sr)
    return sr
