from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Billing(Base):
    __tablename__ = "billing"
    __table_args__ = {"schema": "Taller_mecanico"}

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)

    document_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("Boleta"),
    )

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)

    customer_rut: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_giro: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_comuna: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    order_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("Taller_mecanico.orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    order_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    exento: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    neto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    iva: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default=text("0"))

    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    libredte_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    libredte_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    libredte_document_type_code: Mapped[int | None] = mapped_column(nullable=True)
    libredte_folio: Mapped[int | None] = mapped_column(nullable=True)
    libredte_codigo_generacion: Mapped[str | None] = mapped_column(String(128), nullable=True)
    libredte_pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    libredte_xml_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    observations: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    customer = relationship("Customer", back_populates="billings")
    order = relationship("Order", back_populates="billings")
