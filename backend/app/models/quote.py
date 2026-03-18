import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base


class Quote(Base):
    __tablename__ = "quotes"
    __table_args__ = (
        CheckConstraint(
            "status IN ('Borrador', 'Enviado', 'Aceptado', 'Rechazado', 'Vencido')",
            name="quotes_status_check",
        ),
        {"schema": "Taller_mecanico"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.customers.id", ondelete="RESTRICT"),
        nullable=True,
    )
    vehicle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.vehicles.id", ondelete="RESTRICT"),
        nullable=True,
    )

    customer_name = Column(String(150), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    customer_email = Column(String(150), nullable=True)
    vehicle_text = Column(String(150), nullable=True)
    plate = Column(String(20), nullable=True)

    created_at = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="Borrador")
    total = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)

    created_on = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_on = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer")
    vehicle = relationship("Vehicle")
    order = relationship("Order", back_populates="quote", uselist=False)