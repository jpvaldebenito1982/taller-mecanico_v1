from decimal import Decimal

from fastapi import HTTPException, status

from app.schemas.billing import BillingCreate, BillingDocumentType


def validate_billing_create(payload: BillingCreate) -> None:
    if payload.document_type == BillingDocumentType.factura:
        expected_total = payload.exento + payload.neto + payload.iva
        if expected_total != payload.total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="En Factura el total debe ser igual a exento + neto + iva.",
            )

    if payload.document_type in (
        BillingDocumentType.boleta,
        BillingDocumentType.recibo,
    ):
        if payload.total <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El total debe ser mayor a 0.",
            )