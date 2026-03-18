from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.billing import Billing
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.billing import BillingCreate, BillingUpdate


VALID_STATUSES = {"Pendiente", "Pagada", "Anulada"}
VALID_DOCUMENT_TYPES = {"Boleta", "Factura", "Recibo"}


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
    billing = db.query(Billing).filter(Billing.id == billing_id).first()
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
    order = db.query(Order).filter(Order.id == order_id).first()
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
            detail="Estado inválido",
        )
    return value


def validate_document_type(document_type):
    value = _enum_value(document_type)
    if value not in VALID_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de documento inválido",
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
            detail="Ya existe un documento con ese número",
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
    else:
        if total <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El total debe ser mayor a 0",
            )


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
        document_type=document_type,
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_rut=payload.customer_rut,
        customer_giro=payload.customer_giro if document_type == "Factura" else None,
        customer_address=payload.customer_address if document_type == "Factura" else None,
        customer_comuna=payload.customer_comuna if document_type == "Factura" else None,
        customer_city=payload.customer_city if document_type == "Factura" else None,
        order_id=order.id if order else None,
        order_code=order.code if order else None,
        exento=_to_decimal(payload.exento) if document_type == "Factura" else Decimal("0"),
        neto=_to_decimal(payload.neto) if document_type == "Factura" else Decimal("0"),
        iva=_to_decimal(payload.iva) if document_type == "Factura" else Decimal("0"),
        total=_to_decimal(payload.total),
        payment_method=payload.payment_method,
        status=status_value,
        observations=payload.observations,
    )

    db.add(billing)
    db.commit()
    db.refresh(billing)
    return billing


def update_billing(db: Session, billing_id: UUID, payload: BillingUpdate):
    billing = get_billing_by_id(db, billing_id)

    update_data = payload.model_dump(exclude_unset=True)
    # Si usas Pydantic v1, cambia la línea anterior por:
    # update_data = payload.dict(exclude_unset=True)

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

    billing.document_type = resolved_document_type
    billing.customer_id = customer.id
    billing.customer_name = customer.full_name
    billing.customer_rut = resolved_customer_rut
    billing.order_id = order.id if order else None
    billing.order_code = order.code if order else None
    billing.total = _to_decimal(resolved_total)

    if resolved_document_type == "Factura":
        billing.customer_giro = resolved_customer_giro
        billing.customer_address = resolved_customer_address
        billing.customer_comuna = resolved_customer_comuna
        billing.customer_city = resolved_customer_city
        billing.exento = _to_decimal(resolved_exento)
        billing.neto = _to_decimal(resolved_neto)
        billing.iva = _to_decimal(resolved_iva)
    else:
        billing.customer_giro = None
        billing.customer_address = None
        billing.customer_comuna = None
        billing.customer_city = None
        billing.exento = Decimal("0")
        billing.neto = Decimal("0")
        billing.iva = Decimal("0")

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