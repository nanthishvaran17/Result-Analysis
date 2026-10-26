from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.services.auth_service import list_users, create_user, update_user, get_user_by_username, get_user_by_email
from app.services.audit_service import log_audit
from app.api.deps import require_roles
from app.models.user import User

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def get_staff_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    return list_users(db)

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    if get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, user_in)
    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="CREATE_STAFF_USER",
        target_entity="User",
        target_id=user.username,
        details=f"Created staff account with role {user.role}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def modify_staff_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    user = update_user(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    client_ip = request.client.host if request.client else "unknown"
    log_audit(
        db=db,
        username=current_user.username,
        action="UPDATE_STAFF_USER",
        target_entity="User",
        target_id=user.username,
        details=f"Updated settings/permissions for {user.username}",
        ip_address=client_ip,
        user_id=current_user.id
    )
    return user
