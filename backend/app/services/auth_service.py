from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def list_users(db: Session) -> List[User]:
    return db.query(User).order_by(User.id.asc()).all()

def update_user(db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
    db.commit()
    db.refresh(user)
    return user
