import uuid
from pydantic import BaseModel
from typing import Optional

class VehicleCreate(BaseModel):
    customer_id: uuid.UUID
    plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    mileage_km: Optional[int] = None
    notes: Optional[str] = None

class VehicleUpdate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    mileage_km: Optional[int] = None
    notes: Optional[str] = None

class VehicleOut(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID

    # datos del cliente (del JOIN)
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None

    plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    mileage_km: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True