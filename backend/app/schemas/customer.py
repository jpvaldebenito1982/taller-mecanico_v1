import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional

class CustomerCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    document_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    document_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    document_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True