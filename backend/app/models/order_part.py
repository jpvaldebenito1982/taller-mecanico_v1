import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class OrderPart(Base):
    __tablename__ = "order_parts"
    __table_args__ = {"schema": "Taller_mecanico"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("Taller_mecanico.orders.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("Taller_mecanico.inventory_items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    order = relationship("Order", back_populates="parts")
    inventory_item = relationship("InventoryItem")