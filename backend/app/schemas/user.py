import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

UserRole = Literal["admin", "mechanic", "advisor"]
UserStatus = Literal["active", "inactive"]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = "mechanic"
    status: UserStatus = "active"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus
    lastLogin: Optional[str] = None

    class Config:
        from_attributes = True