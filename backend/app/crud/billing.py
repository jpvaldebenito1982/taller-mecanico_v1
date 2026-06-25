from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.billing import Billing
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_part import OrderPart
from app.schemas.billing import BillingCreate, BillingUpdate
from app.services.libredte import (
    LIBREDTE_BOLETA_ELECTRONICA,
    LIBREDTE_FACTURA_ELECTRONICA,
    download_document_pdf,
    emit_document,
    fetch_document_status,
)


VALID_STATUSES = {"Pendiente", "Pagada", "Anulada"}
VALID_DOCUMENT_TYPES = {"Boleta", "Factura", "Recibo"}
SUPPORTED_LIBREDTE_DOCUMENT_TYPES = {
    "Factura": LIBREDTE_FACTURA_ELECTRONICA,
    "Boleta": LIBREDTE_BOLETA_ELECTRONICA,
}


def _enum_value(value):
    return value.value if hasattr(value, "value") else value


def _to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def get_all_billing(db: Session):
    return (
        db.query(Billing)
        .order_by(Billing.date.desc(), Billing.created_at.desc())
        .all()
    )


def get_billing_by_id(db: Session, billing_id: UUID):
    billing = (
        db.query(Billing)
        .options(
            joinedload(Billing.customer),
            joinedload(Billing.order).joinedload(Order.parts).joinedload(OrderPart.inventory_item),
        )
        .filter(Billing.id == billing_id)
        .first()
    )
    if not billing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado",
        )
    return billing


def get_customer_or_404(db: Session, customer_id: UUID):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )
    return customer


def get_order_or_404(db: Session, order_id: UUID):
    order = (
        db.query(Order)
        .options(joinedload(Order.parts).joinedload(OrderPart.inventory_item))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )
    return order


def validate_status(status_value):
    value = _enum_value(status_value)
    if value not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado invalido",
        )
    return value


def validate_document_type(document_type):
    value = _enum_value(document_type)
    if value not in VALID_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de documento invalido",
        )
    return value


def validate_unique_number(db: Session, number: str, exclude_id: UUID | None = None):
    query = db.query(Billing).filter(Billing.number == number)

    if exclude_id is not None:
        query = query.filter(Billing.id != exclude_id)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un documento con ese numero",
        )


def validate_document_data(
    *,
    document_type: str,
    total,
    exento=None,
    neto=None,
    iva=None,
    customer_rut=None,
    customer_giro=None,
    customer_address=None,
    customer_comuna=None,
    customer_city=None,
):
    total = _to_decimal(total)
    exento = _to_decimal(exento)
    neto = _to_decimal(neto)
    iva = _to_decimal(iva)

    if total < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El total no puede ser negativo",
        )

    if exento < 0 or neto < 0 or iva < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exento, neto e IVA no pueden ser negativos",
        )

    if document_type == "Factura":
        missing_fields = []

        if not customer_rut:
            missing_fields.append("customer_rut")
        if not customer_giro:
            missing_fields.append("customer_giro")
        if not customer_address:
            missing_fields.append("customer_address")
        if not customer_comuna:
            missing_fields.append("customer_comuna")
        if not customer_city:
            missing_fields.append("customer_city")

        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Para Factura faltan campos obligatorios: {', '.join(missing_fields)}",
            )

        expected_total = exento + neto + iva
        if expected_total != total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="En Factura el total debe ser igual a exento + neto + iva",
            )
    elif total <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El total debe ser mayor a 0",
        )


def _hydrate_billing_from_payload(
    billing: Billing,
    *,
    customer,
    order,
    document_type: str,
    total,
    exento,
    neto,
    iva,
    customer_rut,
    customer_giro,
    customer_address,
    customer_comuna,
    customer_city,
):
    billing.document_type = document_type
    billing.customer_id = customer.id
    billing.customer_name = customer.full_name
    billing.customer_rut = customer_rut
    billing.order_id = order.id if order else None
    billing.order_code = order.code if order else None
    billing.total = _to_decimal(total)

    if document_type == "Factura":
        billing.customer_giro = customer_giro
        billing.customer_address = customer_address
        billing.customer_comuna = customer_comuna
        billing.customer_city = customer_city
        billing.exento = _to_decimal(exento)
        billing.neto = _to_decimal(neto)
        billing.iva = _to_decimal(iva)
    else:
        billing.customer_giro = None
        billing.customer_address = None
        billing.customer_comuna = None
        billing.customer_city = None
        billing.exento = Decimal("0")
        billing.neto = Decimal("0")
        billing.iva = Decimal("0")


def create_billing(db: Session, payload: BillingCreate):
    status_value = validate_status(payload.status)
    document_type = validate_document_type(payload.document_type)
    validate_unique_number(db, payload.number)

    customer = get_customer_or_404(db, payload.customer_id)

    order = None
    if payload.order_id:
        order = get_order_or_404(db, payload.order_id)

        if order.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden no pertenece al cliente seleccionado",
            )

    validate_document_data(
        document_type=document_type,
        total=payload.total,
        exento=payload.exento,
        neto=payload.neto,
        iva=payload.iva,
        customer_rut=payload.customer_rut,
        customer_giro=payload.customer_giro,
        customer_address=payload.customer_address,
        customer_comuna=payload.customer_comuna,
        customer_city=payload.customer_city,
    )

    billing = Billing(
        number=payload.number,
        date=payload.date,
        payment_method=payload.payment_method,
        status=status_value,
        observations=payload.observations,
        libredte_status="No emitido",
    )

    _hydrate_billing_from_payload(
        billing,
        customer=customer,
        order=order,
        document_type=document_type,
        total=payload.total,
        exento=payload.exento,
        neto=payload.neto,
        iva=payload.iva,
        customer_rut=payload.customer_rut,
        customer_giro=payload.customer_giro,
        customer_address=payload.customer_address,
        customer_comuna=payload.customer_comuna,
        customer_city=payload.customer_city,
    )

    db.add(billing)
    db.commit()
    db.refresh(billing)
    return billing


def update_billing(db: Session, billing_id: UUID, payload: BillingUpdate):
    billing = get_billing_by_id(db, billing_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        billing.status = validate_status(update_data["status"])

    if "number" in update_data and update_data["number"] != billing.number:
        validate_unique_number(db, update_data["number"], exclude_id=billing.id)
        billing.number = update_data["number"]

    if "date" in update_data:
        billing.date = update_data["date"]

    if "payment_method" in update_data:
        billing.payment_method = update_data["payment_method"]

    resolved_document_type = validate_document_type(
        update_data.get("document_type", billing.document_type)
    )

    resolved_customer_id = update_data.get("customer_id", billing.customer_id)
    resolved_order_id = (
        update_data["order_id"] if "order_id" in update_data else billing.order_id
    )

    customer = get_customer_or_404(db, resolved_customer_id)

    order = None
    if resolved_order_id:
        order = get_order_or_404(db, resolved_order_id)

        if order.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden no pertenece al cliente seleccionado",
            )

    resolved_customer_rut = (
        update_data["customer_rut"]
        if "customer_rut" in update_data
        else billing.customer_rut
    )
    resolved_customer_giro = (
        update_data["customer_giro"]
        if "customer_giro" in update_data
        else billing.customer_giro
    )
    resolved_customer_address = (
        update_data["customer_address"]
        if "customer_address" in update_data
        else billing.customer_address
    )
    resolved_customer_comuna = (
        update_data["customer_comuna"]
        if "customer_comuna" in update_data
        else billing.customer_comuna
    )
    resolved_customer_city = (
        update_data["customer_city"]
        if "customer_city" in update_data
        else billing.customer_city
    )

    resolved_exento = update_data.get("exento", billing.exento)
    resolved_neto = update_data.get("neto", billing.neto)
    resolved_iva = update_data.get("iva", billing.iva)
    resolved_total = update_data.get("total", billing.total)

    validate_document_data(
        document_type=resolved_document_type,
        total=resolved_total,
        exento=resolved_exento,
        neto=resolved_neto,
        iva=resolved_iva,
        customer_rut=resolved_customer_rut,
        customer_giro=resolved_customer_giro,
        customer_address=resolved_customer_address,
        customer_comuna=resolved_customer_comuna,
        customer_city=resolved_customer_city,
    )

    _hydrate_billing_from_payload(
        billing,
        customer=customer,
        order=order,
        document_type=resolved_document_type,
        total=resolved_total,
        exento=resolved_exento,
        neto=resolved_neto,
        iva=resolved_iva,
        customer_rut=resolved_customer_rut,
        customer_giro=resolved_customer_giro,
        customer_address=resolved_customer_address,
        customer_comuna=resolved_customer_comuna,
        customer_city=resolved_customer_city,
    )

    if "observations" in update_data:
        billing.observations = update_data["observations"]

    db.commit()
    db.refresh(billing)
    return billing


def delete_billing(db: Session, billing_id: UUID):
    billing = get_billing_by_id(db, billing_id)

    db.delete(billing)
    db.commit()

    return {"message": "Documento eliminado correctamente"}


def _resolve_receptor_rut(billing: Billing) -> str:
    if billing.customer_rut:
        return billing.customer_rut

    if billing.document_type == "Boleta":
        return settings.LIBREDTE_DEFAULT_BOLETA_RUT

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="El documento requiere RUT del cliente para emitirse en LibreDTE.",
    )


def _build_dte_detail(billing: Billing) -> list[dict[str, Any]]:
    if billing.order and getattr(billing.order, "parts", None):
        details = []
        for part in billing.order.parts:
            details.append(
                {
                    "NmbItem": getattr(part.inventory_item, "name", None)
                    or settings.LIBREDTE_DEFAULT_ITEM_NAME,
                    "QtyItem": int(part.quantity or 1),
                    "PrcItem": int(_to_decimal(part.unit_price)),
                }
            )

        if details:
            return details

    description = billing.observations or settings.LIBREDTE_DEFAULT_ITEM_NAME
    if billing.order_code:
        description = f"{description} ({billing.order_code})"

    return [
        {
            "NmbItem": description[:80],
            "QtyItem": 1,
            "PrcItem": int(_to_decimal(billing.total)),
        }
    ]


def _build_libredte_payload(billing: Billing) -> dict[str, Any]:
    document_type_code = SUPPORTED_LIBREDTE_DOCUMENT_TYPES.get(billing.document_type)
    if not document_type_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo Factura y Boleta pueden emitirse en LibreDTE.",
        )

    receptor: dict[str, Any] = {
        "RUTRecep": _resolve_receptor_rut(billing),
        "RznSocRecep": billing.customer_name,
    }

    if billing.customer_giro:
        receptor["GiroRecep"] = billing.customer_giro
    if billing.customer_address:
        receptor["DirRecep"] = billing.customer_address
    if billing.customer_comuna:
        receptor["CmnaRecep"] = billing.customer_comuna
    if billing.customer_city:
        receptor["CiudadRecep"] = billing.customer_city

    payload: dict[str, Any] = {
        "Encabezado": {
            "IdDoc": {
                "TipoDTE": document_type_code,
                "FchEmis": billing.date.isoformat(),
            },
            "Emisor": {
                "RUTEmisor": settings.LIBREDTE_EMISOR_RUT,
            },
            "Receptor": receptor,
        },
        "Detalle": _build_dte_detail(billing),
        "LibreDTE": {
            "extra": {
                "dte": {
                    "Encabezado": {
                        "IdDoc": {
                            "TermPagoGlosa": billing.payment_method,
                        }
                    }
                }
            }
        },
    }

    if billing.observations:
        payload["LibreDTE"]["extra"]["observaciones"] = billing.observations

    return payload


def emit_billing_to_libredte(db: Session, billing_id: UUID):
    billing = get_billing_by_id(db, billing_id)
    result = emit_document(_build_libredte_payload(billing))

    billing.libredte_status = "Emitido" if result.folio else "Pendiente"
    billing.libredte_message = result.message
    billing.libredte_document_type_code = result.document_type_code
    billing.libredte_folio = result.folio
    billing.libredte_codigo_generacion = result.generation_code
    billing.libredte_pdf_path = result.pdf_path
    billing.libredte_xml_path = result.xml_path

    db.commit()
    db.refresh(billing)

    return billing, result.temporary, result.generated


def sync_billing_libredte_status(db: Session, billing_id: UUID):
    billing = get_billing_by_id(db, billing_id)

    if not billing.libredte_document_type_code or not billing.libredte_folio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento aun no tiene folio LibreDTE para consultar estado.",
        )

    remote_status = fetch_document_status(
        billing.libredte_document_type_code,
        billing.libredte_folio,
    )

    billing.libredte_message = str(
        remote_status.get("message")
        or remote_status.get("mensaje")
        or remote_status.get("glosa")
        or billing.libredte_message
        or "Estado consultado en LibreDTE."
    )
    billing.libredte_status = "Emitido"

    db.commit()
    db.refresh(billing)

    return billing, remote_status


def get_billing_pdf_bytes(db: Session, billing_id: UUID) -> bytes:
    billing = get_billing_by_id(db, billing_id)

    if not billing.libredte_document_type_code or not billing.libredte_folio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento aun no tiene un folio emitido en LibreDTE.",
        )

    return download_document_pdf(
        billing.libredte_document_type_code,
        billing.libredte_folio,
    )
