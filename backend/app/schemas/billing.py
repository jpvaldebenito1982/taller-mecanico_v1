from datetime import date as DateType, datetime as DateTime
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BillingDocumentType(str, Enum):
    boleta = "Boleta"
    factura = "Factura"
    recibo = "Recibo"


class BillingStatus(str, Enum):
    pendiente = "Pendiente"
    pagada = "Pagada"
    anulada = "Anulada"


class LibreDTEStatus(str, Enum):
    not_sent = "No emitido"
    pending = "Pendiente"
    certified = "Emitido"
    error = "Error"


class BillingBase(BaseModel):
    number: str = Field(..., max_length=50)
    date: DateType
    document_type: BillingDocumentType = BillingDocumentType.boleta

    customer_id: UUID
    customer_name: str = Field(..., max_length=255)

    customer_rut: str | None = Field(default=None, max_length=20)
    customer_giro: str | None = Field(default=None, max_length=255)
    customer_address: str | None = Field(default=None, max_length=255)
    customer_comuna: str | None = Field(default=None, max_length=100)
    customer_city: str | None = Field(default=None, max_length=100)

    order_id: UUID | None = None
    order_code: str | None = Field(default=None, max_length=20)

    exento: Decimal = Decimal("0")
    neto: Decimal = Decimal("0")
    iva: Decimal = Decimal("0")
    total: Decimal = Decimal("0")

    payment_method: str = Field(..., max_length=50)
    status: BillingStatus
    observations: str | None = None

    @model_validator(mode="after")
    def validate_by_document_type(self):
        if self.total < 0:
            raise ValueError("El total no puede ser negativo.")

        if self.exento < 0 or self.neto < 0 or self.iva < 0:
            raise ValueError("Exento, neto e IVA no pueden ser negativos.")

        if self.document_type == BillingDocumentType.factura:
            required_fields = {
                "customer_rut": self.customer_rut,
                "customer_giro": self.customer_giro,
                "customer_address": self.customer_address,
                "customer_comuna": self.customer_comuna,
                "customer_city": self.customer_city,
            }
            missing = [key for key, value in required_fields.items() if not value]

            if missing:
                raise ValueError(
                    f"Para Factura faltan campos obligatorios: {', '.join(missing)}"
                )

            expected_total = self.exento + self.neto + self.iva
            if expected_total != self.total:
                raise ValueError(
                    "En Factura el total debe ser igual a exento + neto + iva."
                )
        else:
            self.exento = Decimal("0")
            self.neto = Decimal("0")
            self.iva = Decimal("0")

        return self


class BillingCreate(BillingBase):
    pass


class BillingUpdate(BaseModel):
    number: str | None = Field(default=None, max_length=50)
    date: DateType | None = None
    document_type: BillingDocumentType | None = None

    customer_id: UUID | None = None
    customer_name: str | None = Field(default=None, max_length=255)

    customer_rut: str | None = Field(default=None, max_length=20)
    customer_giro: str | None = Field(default=None, max_length=255)
    customer_address: str | None = Field(default=None, max_length=255)
    customer_comuna: str | None = Field(default=None, max_length=100)
    customer_city: str | None = Field(default=None, max_length=100)

    order_id: UUID | None = None
    order_code: str | None = Field(default=None, max_length=20)

    exento: Decimal | None = None
    neto: Decimal | None = None
    iva: Decimal | None = None
    total: Decimal | None = None

    payment_method: str | None = Field(default=None, max_length=50)
    status: BillingStatus | None = None
    observations: str | None = None


class BillingListItem(BaseModel):
    id: UUID
    number: str
    date: DateType
    document_type: BillingDocumentType
    customer: str
    customer_rut: str | None = None
    order_id: UUID | None = None
    order_code: str | None = None
    total: Decimal
    payment_method: str
    status: BillingStatus
    observations: str | None = None
    libredte_status: str | None = None
    libredte_message: str | None = None
    libredte_document_type_code: int | None = None
    libredte_folio: int | None = None
    libredte_codigo_generacion: str | None = None
    libredte_pdf_path: str | None = None
    libredte_xml_path: str | None = None

    model_config = ConfigDict(from_attributes=True)


class BillingResponse(BillingBase):
    id: UUID
    created_at: DateTime
    updated_at: DateTime
    libredte_status: str | None = None
    libredte_message: str | None = None
    libredte_document_type_code: int | None = None
    libredte_folio: int | None = None
    libredte_codigo_generacion: str | None = None
    libredte_pdf_path: str | None = None
    libredte_xml_path: str | None = None

    model_config = ConfigDict(from_attributes=True)


class BillingEmitResponse(BaseModel):
    billing: BillingResponse
    certification_mode: bool
    temporary_response: dict[str, Any]
    generated_response: dict[str, Any]


class BillingStatusSyncResponse(BaseModel):
    billing: BillingResponse
    remote_status: dict[str, Any]
