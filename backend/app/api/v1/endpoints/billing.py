from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.billing import (
    create_billing,
    delete_billing,
    emit_billing_to_libredte,
    get_all_billing,
    get_billing_by_id,
    get_billing_pdf_bytes,
    sync_billing_libredte_status,
    update_billing,
)
from app.db.session import get_db
from app.schemas.billing import (
    BillingCreate,
    BillingEmitResponse,
    BillingListItem,
    BillingResponse,
    BillingStatusSyncResponse,
    BillingUpdate,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


def _to_list_item(item) -> BillingListItem:
    return BillingListItem(
        id=item.id,
        number=item.number,
        date=item.date,
        document_type=item.document_type,
        customer=item.customer_name,
        customer_rut=item.customer_rut,
        order_id=item.order_id,
        order_code=item.order_code,
        total=item.total,
        payment_method=item.payment_method,
        status=item.status,
        observations=item.observations,
        libredte_status=item.libredte_status,
        libredte_message=item.libredte_message,
        libredte_document_type_code=item.libredte_document_type_code,
        libredte_folio=item.libredte_folio,
        libredte_codigo_generacion=item.libredte_codigo_generacion,
        libredte_pdf_path=item.libredte_pdf_path,
        libredte_xml_path=item.libredte_xml_path,
    )


@router.get("/", response_model=List[BillingListItem])
def list_billing(db: Session = Depends(get_db)):
    records = get_all_billing(db)
    return [_to_list_item(item) for item in records]


@router.get("/{billing_id}", response_model=BillingResponse)
def retrieve_billing(billing_id: UUID, db: Session = Depends(get_db)):
    return get_billing_by_id(db, billing_id)


@router.post("/", response_model=BillingResponse, status_code=201)
def create_billing_endpoint(payload: BillingCreate, db: Session = Depends(get_db)):
    return create_billing(db, payload)


@router.put("/{billing_id}", response_model=BillingResponse)
def update_billing_endpoint(
    billing_id: UUID,
    payload: BillingUpdate,
    db: Session = Depends(get_db),
):
    return update_billing(db, billing_id, payload)


@router.post("/{billing_id}/libredte/emit", response_model=BillingEmitResponse)
def emit_billing_endpoint(billing_id: UUID, db: Session = Depends(get_db)):
    billing, temporary_response, generated_response = emit_billing_to_libredte(db, billing_id)
    return BillingEmitResponse(
        billing=billing,
        certification_mode=settings.LIBREDTE_USE_CERTIFICATION,
        temporary_response=temporary_response,
        generated_response=generated_response,
    )


@router.post("/{billing_id}/libredte/status", response_model=BillingStatusSyncResponse)
def sync_billing_status_endpoint(billing_id: UUID, db: Session = Depends(get_db)):
    billing, remote_status = sync_billing_libredte_status(db, billing_id)
    return BillingStatusSyncResponse(billing=billing, remote_status=remote_status)


@router.get("/{billing_id}/libredte/pdf")
def billing_pdf_endpoint(billing_id: UUID, db: Session = Depends(get_db)):
    pdf_bytes = get_billing_pdf_bytes(db, billing_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="billing-{billing_id}.pdf"'},
    )


@router.delete("/{billing_id}")
def delete_billing_endpoint(billing_id: UUID, db: Session = Depends(get_db)):
    return delete_billing(db, billing_id)
