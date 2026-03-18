import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.crud.customer import (
    list_customers, get_customer, create_customer, update_customer, delete_customer
)

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/", response_model=list[CustomerOut])
def api_list_customers(db: Session = Depends(get_db)):
    return list_customers(db)

@router.get("/{customer_id}", response_model=CustomerOut)
def api_get_customer(customer_id: uuid.UUID, db: Session = Depends(get_db)):
    c = get_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return c

@router.post("/", response_model=CustomerOut)
def api_create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return create_customer(db, payload)

@router.put("/{customer_id}", response_model=CustomerOut)
def api_update_customer(customer_id: uuid.UUID, payload: CustomerUpdate, db: Session = Depends(get_db)):
    c = get_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return update_customer(db, c, payload)

@router.delete("/{customer_id}")
def api_delete_customer(customer_id: uuid.UUID, db: Session = Depends(get_db)):
    c = get_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    delete_customer(db, c)
    return {"ok": True}