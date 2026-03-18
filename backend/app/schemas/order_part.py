from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class OrderPartCreate(BaseModel):
    inventory_item_id: UUID
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class OrderPartUpdate(BaseModel):
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class OrderPartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    inventory_item_id: UUID
    quantity: int
    unit_price: Decimal
    created_at: datetime
    updated_at: datetime

    inventory_code: str
    inventory_name: str
    inventory_stock: int
    line_total: Decimal