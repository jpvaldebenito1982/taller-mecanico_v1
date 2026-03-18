from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.billing import (
    create_billing,
    delete_billing,
    get_all_billing,
    get_billing_by_id,
    update_billing,
)
from app.db.session import get_db
from app.schemas.billing import (
    BillingCreate,
    BillingListItem,
    BillingResponse,
    BillingUpdate,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/", response_model=List[BillingListItem])
def list_billing(db: Session = Depends(get_db)):
    records = get_all_billing(db)

    return [
        BillingListItem(
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
        )
        for item in records
    ]


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


@router.delete("/{billing_id}")
def delete_billing_endpoint(billing_id: UUID, db: Session = Depends(get_db)):
    return delete_billing(db, billing_id)