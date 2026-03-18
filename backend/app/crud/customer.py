import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate

def list_customers(db: Session) -> list[Customer]:
    return db.execute(select(Customer).order_by(Customer.full_name.asc())).scalars().all()

def get_customer(db: Session, customer_id: uuid.UUID) -> Customer | None:
    return db.get(Customer, customer_id)

def create_customer(db: Session, data: CustomerCreate) -> Customer:
    obj = Customer(
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else None,
        email=data.email.strip().lower() if data.email else None,
        document_id=data.document_id.strip() if data.document_id else None,
        address=data.address.strip() if data.address else None,
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_customer(db: Session, obj: Customer, data: CustomerUpdate) -> Customer:
    if data.full_name is not None:
        obj.full_name = data.full_name.strip()
    if data.phone is not None:
        obj.phone = data.phone.strip() if data.phone else None
    if data.email is not None:
        obj.email = data.email.strip().lower() if data.email else None
    if data.document_id is not None:
        obj.document_id = data.document_id.strip() if data.document_id else None
    if data.address is not None:
        obj.address = data.address.strip() if data.address else None
    if data.notes is not None:
        obj.notes = data.notes.strip() if data.notes else None

    db.commit()
    db.refresh(obj)
    return obj

def delete_customer(db: Session, obj: Customer) -> None:
    db.delete(obj)
    db.commit()