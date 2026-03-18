from datetime import datetime
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


MovementType = Literal["entrada", "salida", "ajuste"]
ReferenceType = Literal["order", "manual", "purchase"]


class InventoryMovementBase(BaseModel):
    inventory_item_id: UUID
    movement_type: MovementType
    quantity: int = Field(..., gt=0)
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[UUID] = None
    notes: Optional[str] = None


class InventoryMovementCreate(InventoryMovementBase):
    created_by: Optional[UUID] = None


class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inventory_item_id: UUID
    movement_type: MovementType
    quantity: int
    reference_type: Optional[ReferenceType]
    reference_id: Optional[UUID]
    notes: Optional[str]
    created_by: Optional[UUID]
    created_at: datetime

    inventory_code: str
    inventory_name: str
    resulting_stock: int