from decimal import Decimal
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


StockStatus = Literal["OK", "Bajo", "Sin stock"]


class InventoryBase(BaseModel):
    code: str = Field(..., max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    stock: int = Field(..., ge=0)
    min_stock: int = Field(..., ge=0)
    location: Optional[str] = Field(None, max_length=100)
    unit_cost: Decimal = Field(..., ge=0)
    unit_price: Decimal = Field(..., ge=0)
    supplier: Optional[str] = Field(None, max_length=255)


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    stock: Optional[int] = Field(None, ge=0)
    min_stock: Optional[int] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    barcode: Optional[str]
    name: str
    category: str
    stock: int
    min_stock: int
    location: Optional[str]
    unit_cost: Decimal
    unit_price: Decimal
    supplier: Optional[str]
    is_active: bool
    stock_status: StockStatus
    created_at: datetime
    updated_at: datetime