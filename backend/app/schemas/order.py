# app/schemas/order.py
import uuid
from uuid import UUID
from datetime import date
from decimal import Decimal
from typing import Optional
from enum import Enum

from pydantic import BaseModel, ConfigDict


class OrderStatus(str, Enum):
    ABIERTA = "Abierta"
    EN_PROCESO = "En proceso"
    FINALIZADA = "Finalizada"
    EN_ESPERA_REPUESTOS = "En espera de repuestos"


class OrderPriority(str, Enum):
    BAJA = "Baja"
    MEDIA = "Media"
    ALTA = "Alta"

class OrderImageResponse(BaseModel):
    id: UUID
    file_name: str
    file_url: str


class OrderCreate(BaseModel):
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    quote_id: Optional[uuid.UUID] = None
    created_at: date
    promised_at: Optional[date] = None
    status: OrderStatus
    priority: OrderPriority
    description: str


class OrderUpdate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    vehicle_id: Optional[uuid.UUID] = None
    quote_id: Optional[uuid.UUID] = None
    created_at: Optional[date] = None
    promised_at: Optional[date] = None
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    total: Optional[Decimal] = None
    description: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    plate: str
    vehicle: str
    customer: str
    created_at: date
    promised_at: Optional[date] = None
    status: OrderStatus
    priority: OrderPriority
    description: str
    phone: Optional[str] = None
    total: Optional[Decimal] = None
    quote_id: Optional[uuid.UUID] = None
    quote_code: Optional[str] = None
    images: list[OrderImageResponse] = []