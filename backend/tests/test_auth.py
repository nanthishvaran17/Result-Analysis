import pytest
from app.core.database import SessionLocal
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.services.auth_service import authenticate_user

def test_password_hashing():
    pwd = "StaffSecretPassword456!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_flow():
    token = create_access_token(subject="admin", role="ADMIN")
    assert isinstance(token, str)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "admin"
    assert payload["role"] == "ADMIN"

def test_staff_authentication():
    db = SessionLocal()
    try:
        user = authenticate_user(db, "admin", "AdminPassword123!")
        assert user is not None
        assert user.username == "admin"
        assert user.role == "ADMIN"

        invalid_user = authenticate_user(db, "admin", "BadPassword!")
        assert invalid_user is None
    finally:
        db.close()
