from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.result import StudentResult, SubjectResult
from app.models.student import Student
from app.models.subject import Subject
from app.models.session import ExamSession
from app.schemas.result import (
    ResultMatrixResponse, SubjectColumnHeader, StudentMatrixRow, StudentResultResponse, SubjectResultItem,
    RankHolderItem, AtRiskStudentItem, RankAndRemedialResponse,
    SubjectPerformanceItem, SubjectPerformanceResponse
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

def get_rank_and_remedial_analytics(
    db: Session,
    session_id: int,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None
) -> RankAndRemedialResponse:
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    session_code = session_obj.session_code if session_obj else f"SESSION_{session_id}"

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

    all_results = query.all()
    total_appeared = len(all_results)
    
    # 1. Toppers: Only students who passed with 0 current arrears and 0 standing arrears
    passed_results = [
        r for r in all_results
        if r.result_status == "PASS" and r.arrears_count == 0 and r.standing_arrears_count == 0
    ]
    # Sort toppers by GPA descending, then earned_credits descending, then register_number
    passed_results.sort(key=lambda r: (-r.gpa, -r.earned_credits, r.student.register_number))

    toppers: List[RankHolderItem] = []
    current_rank = 1
    for r in passed_results:
        toppers.append(
            RankHolderItem(
                rank=current_rank,
                student_id=r.student_id,
                register_number=r.student.register_number,
                student_name=r.student.name,
                department_code=r.student.department_code,
                batch=r.student.batch,
                semester=r.semester,
                gpa=r.gpa,
                earned_credits=r.earned_credits
            )
        )
        current_rank += 1

    # 2. At-Risk / Remedial Students:
    # Students with current arrears > 0 OR standing_arrears > 0 OR GPA < 6.0
    at_risk_list: List[AtRiskStudentItem] = []
    for r in all_results:
        is_at_risk = (r.arrears_count > 0) or (r.standing_arrears_count > 0) or (r.gpa < 6.0)
        if is_at_risk:
            failed_codes = [
                sub_res.subject.code
                for sub_res in r.subject_results
                if sub_res.subject and sub_res.grade in ARREAR_GRADES
            ]
            at_risk_list.append(
                AtRiskStudentItem(
                    student_id=r.student_id,
                    register_number=r.student.register_number,
                    student_name=r.student.name,
                    department_code=r.student.department_code,
                    batch=r.student.batch,
                    semester=r.semester,
                    gpa=r.gpa,
                    arrears_count=r.arrears_count,
                    standing_arrears_count=r.standing_arrears_count,
                    failed_subjects=failed_codes
                )
            )

    # Sort at-risk by arrears_count desc, then standing_arrears desc, then gpa asc
    at_risk_list.sort(key=lambda item: (-item.arrears_count, -item.standing_arrears_count, item.gpa))

    return RankAndRemedialResponse(
        session_code=session_code,
        department_code=department_code,
        semester=semester,
        toppers=toppers,
        at_risk=at_risk_list,
        total_appeared=total_appeared,
        total_passed=len(passed_results),
        total_at_risk=len(at_risk_list)
    )

def get_subject_performance_analytics(
    db: Session,
    session_id: int,
    department_code: Optional[str] = None,
    batch: Optional[str] = None,
    semester: Optional[int] = None
) -> SubjectPerformanceResponse:
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    session_code = session_obj.session_code if session_obj else f"SESSION_{session_id}"

    # Query all SubjectResults joined with StudentResult and Student for this filter
    query = (
        db.query(SubjectResult)
        .join(StudentResult, SubjectResult.student_result_id == StudentResult.id)
        .join(Student, StudentResult.student_id == Student.id)
        .filter(StudentResult.session_id == session_id)
    )
    if department_code:
        query = query.filter(Student.department_code == department_code)
    if batch:
        query = query.filter(Student.batch == batch)
    if semester:
        query = query.filter(StudentResult.semester == semester)

    subject_results = query.all()

    # Group by subject
    subjects_data: Dict[int, Dict[str, Any]] = {}
    for sr in subject_results:
        sub = sr.subject
        if not sub:
            continue
        sub_id = sub.id
        if sub_id not in subjects_data:
            subjects_data[sub_id] = {
                "subject_code": sub.code,
                "subject_name": sub.name,
                "credits": sub.credits,
                "appeared": 0,
                "passed": 0,
                "failed": 0,
                "grades_count": {g: 0 for g in ["O", "A+", "A", "B+", "B", "C", "RA", "SA", "W", "AB"]}
            }

        rec = subjects_data[sub_id]
        rec["appeared"] += 1
        grade = sr.grade.strip().upper()
        if grade in rec["grades_count"]:
            rec["grades_count"][grade] += 1
        else:
            rec["grades_count"][grade] = 1

        if grade in PASSING_GRADES:
            rec["passed"] += 1
        else:
            rec["failed"] += 1

    items: List[SubjectPerformanceItem] = []
    total_subject_appeared = 0
    total_subject_passed = 0

    for sub_id, data in subjects_data.items():
        app = data["appeared"]
        pas = data["passed"]
        total_subject_appeared += app
        total_subject_passed += pas
        pct = round((pas / app * 100), 2) if app > 0 else 0.0

        if pct >= 85.0:
            level = "HIGH"
        elif pct >= 70.0:
            level = "AVERAGE"
        else:
            level = "LOW"

        items.append(
            SubjectPerformanceItem(
                subject_code=data["subject_code"],
                subject_name=data["subject_name"],
                credits=data["credits"],
                appeared=app,
                passed=pas,
                failed=data["failed"],
                pass_percentage=pct,
                grades_count=data["grades_count"],
                performance_level=level
            )
        )

    # Sort items alphabetically by subject code
    items.sort(key=lambda s: s.subject_code)

    overall_pass_pct = (
        round((total_subject_passed / total_subject_appeared * 100), 2)
        if total_subject_appeared > 0
        else 0.0
    )

    return SubjectPerformanceResponse(
        session_code=session_code,
        department_code=department_code,
        semester=semester,
        subjects=items,
        overall_pass_percentage=overall_pass_pct
    )

