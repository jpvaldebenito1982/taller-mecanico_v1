import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def _status_to_is_active(status: str) -> bool:
    return status == "active"

def _is_active_to_status(is_active: bool) -> str:
    return "active" if is_active else "inactive"

def list_users(db: Session) -> list[User]:
    return db.execute(select(User).order_by(User.created_at.desc())).scalars().all()

def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def create_user(db: Session, data: UserCreate) -> User:
    obj = User(
        full_name=data.name.strip(),
        email=data.email.strip().lower(),
        phone=data.phone.strip() if data.phone else None,
        role=data.role,
        is_active=_status_to_is_active(data.status),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_user(db: Session, obj: User, data: UserUpdate) -> User:
    if data.name is not None:
        obj.full_name = data.name.strip()
    if data.email is not None:
        obj.email = data.email.strip().lower()
    if data.phone is not None:
        obj.phone = data.phone.strip() if data.phone else None
    if data.role is not None:
        obj.role = data.role
    if data.status is not None:
        obj.is_active = _status_to_is_active(data.status)

    db.commit()
    db.refresh(obj)
    return obj

def delete_user(db: Session, obj: User) -> None:
    db.delete(obj)
    db.commit()

def to_out(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.full_name or "",
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "status": _is_active_to_status(u.is_active),
        "lastLogin": None,
    }