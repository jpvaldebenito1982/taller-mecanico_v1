import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = {"schema": "Taller_mecanico"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    inventory_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.inventory_items.id"),
        nullable=False,
        index=True,
    )

    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    reference_type = Column(String(30), nullable=True)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(Text, nullable=True)

    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.users.id"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    inventory_item = relationship("InventoryItem")
    created_by_user = relationship("User")
    