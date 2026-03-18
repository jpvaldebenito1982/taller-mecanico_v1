import uuid
from sqlalchemy import String, Integer, DateTime, func, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = {"schema": "Taller_mecanico"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('Taller_mecanico.customers.id', onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    plate: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    brand: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(40), nullable=True)
    mileage_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # opcional: relación para joins fáciles
    customer = relationship("Customer", lazy="joined")
    quotes = relationship("Quote", back_populates="vehicle")
    orders = relationship("Order", back_populates="vehicle")