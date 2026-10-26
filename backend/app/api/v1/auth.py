from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import UserLogin, Token, UserResponse
from app.services.auth_service import authenticate_user
from app.services.audit_service import log_audit
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    client_ip = request.client.host if request.client else "unknown"

    if not user:
        log_audit(
            db=db,
            username=login_data.username,
            action="LOGIN_FAILED",
            details="Invalid username or password attempt",
            ip_address=client_ip,
            status="FAILURE"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.username, role=user.role)
    log_audit(
        db=db,
        username=user.username,
        action="LOGIN_SUCCESS",
        details=f"User logged in with role {user.role}",
        ip_address=client_ip,
        status="SUCCESS",
        user_id=user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="LOGOUT",
        details="User logged out session",
        ip_address=client_ip,
        status="SUCCESS",
        user_id=current_user.id
    )
    return {"message": "Logged out successfully"}
