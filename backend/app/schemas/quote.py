from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, model_validator


QuoteStatus = str


class QuoteCreate(BaseModel):
    customer_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None

    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    vehicle_text: Optional[str] = None
    plate: Optional[str] = None

    created_at: date
    valid_until: date
    status: str = "Borrador"
    total: Decimal = Decimal("0")
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_customer_or_free_text(self):
        has_registered = self.customer_id is not None
        has_free_text = bool(self.customer_name and self.customer_name.strip())

        if not has_registered and not has_free_text:
            raise ValueError(
                "Debes indicar un cliente registrado o ingresar el nombre del cliente ocasional."
            )

        if has_registered and self.vehicle_id is None:
            raise ValueError(
                "Si seleccionas un cliente registrado, debes indicar también un vehículo registrado."
            )

        if not has_registered:
            if not self.vehicle_text or not self.vehicle_text.strip():
                raise ValueError(
                    "Debes ingresar la descripción del vehículo cuando el cliente es ocasional."
                )

        return self


class QuoteUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None

    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    vehicle_text: Optional[str] = None
    plate: Optional[str] = None

    created_at: Optional[date] = None
    valid_until: Optional[date] = None
    status: Optional[str] = None
    total: Optional[Decimal] = None
    notes: Optional[str] = None


class QuoteResponse(BaseModel):
    id: UUID
    code: str

    customer_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None

    customer: str
    vehicle: str
    plate: str

    created_at: date
    valid_until: date
    status: str
    total: Decimal
    notes: Optional[str] = None