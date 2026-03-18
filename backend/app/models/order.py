import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"schema": "Taller_mecanico"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        index=True,
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quote_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.quotes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    promised_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    total: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    created_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    customer = relationship("Customer", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
    quote = relationship("Quote", back_populates="order")
    images = relationship("OrderImage", back_populates="order", cascade="all, delete-orphan",)
    parts = relationship("OrderPart", back_populates="order", cascade="all, delete-orphan")
    billings = relationship("Billing", back_populates="order")