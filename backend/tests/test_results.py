import pytest
from app.core.database import SessionLocal
from app.services.result_service import (
    calculate_gpa_and_status, get_result_matrix,
    get_rank_and_remedial_analytics, get_subject_performance_analytics
)

def test_deterministic_academic_calculations():
    # Student with all passes: O (10), A+ (9), A (8)
    subjects = [
        {"code": "CS3591", "credits": 4, "grade": "O"},
        {"code": "CS3501", "credits": 4, "grade": "A+"},
        {"code": "CB3491", "credits": 3, "grade": "A"},
    ]
    calc = calculate_gpa_and_status(subjects)
    # Total points = (4*10) + (4*9) + (3*8) = 40 + 36 + 24 = 100
    # Total credits = 11. GPA = 100 / 11 = 9.09
    assert calc["total_credits"] == 11
    assert calc["earned_credits"] == 11
    assert calc["gpa"] == 9.09
    assert calc["result_status"] == "PASS"
    assert calc["arrears_count"] == 0

def test_arrear_calculation():
    # Student with 1 arrear (RA in Compiler Design)
    subjects = [
        {"code": "CS3591", "credits": 4, "grade": "B+"},  # 7*4=28
        {"code": "CS3501", "credits": 4, "grade": "RA"},  # 0
        {"code": "CB3491", "credits": 3, "grade": "B"},   # 6*3=18
    ]
    calc = calculate_gpa_and_status(subjects)
    # Total credits = 11, Earned = 7. Points = 46. GPA = 46/11 = 4.18
    assert calc["total_credits"] == 11
    assert calc["earned_credits"] == 7
    assert calc["gpa"] == 4.18
    assert calc["result_status"] == "FAIL"
    assert calc["arrears_count"] == 1

def test_result_matrix_generation():
    db = SessionLocal()
    try:
        matrix = get_result_matrix(db, session_id=1, department_code="CSE")
        assert matrix.session_code == "NOV_DEC_2025"
        assert len(matrix.columns) > 0
        assert len(matrix.rows) >= 12
        assert matrix.total_students >= 12
        assert matrix.pass_percentage >= 0.0
    finally:
        db.close()

def test_rank_and_remedial_analytics():
    db = SessionLocal()
    try:
        analytics = get_rank_and_remedial_analytics(db, session_id=1, department_code="CSE")
        assert analytics.session_code == "NOV_DEC_2025"
        assert analytics.total_appeared >= 10
        # Toppers must be sorted descending by GPA with 0 arrears
        if analytics.toppers:
            assert analytics.toppers[0].rank == 1
            if len(analytics.toppers) > 1:
                assert analytics.toppers[0].gpa >= analytics.toppers[1].gpa
        # At-risk list must have arrears count > 0 or GPA < 6.0
        for st in analytics.at_risk:
            assert (st.arrears_count > 0) or (st.standing_arrears_count > 0) or (st.gpa < 6.0)
    finally:
        db.close()

def test_subject_performance_analytics():
    db = SessionLocal()
    try:
        sub_perf = get_subject_performance_analytics(db, session_id=1, department_code="CSE")
        assert sub_perf.session_code == "NOV_DEC_2025"
        assert len(sub_perf.subjects) > 0
        for s in sub_perf.subjects:
            assert s.appeared >= 0
            assert s.passed + s.failed == s.appeared
            assert s.performance_level in ["HIGH", "AVERAGE", "LOW"]
            assert 0.0 <= s.pass_percentage <= 100.0
    finally:
        db.close()

