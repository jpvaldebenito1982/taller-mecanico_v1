from typing import Optional
import uuid

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.models.order import Order
from app.models.quote import Quote
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.schemas.order import OrderCreate, OrderUpdate


def generate_order_code(db: Session) -> str:
    last_order = db.query(Order).order_by(Order.created_on.desc()).first()

    if not last_order or not last_order.code:
        return "OT-00001"

    try:
        last_number = int(last_order.code.replace("OT-", ""))
        next_number = last_number + 1
    except ValueError:
        next_number = 1

    return f"OT-{next_number:05d}"


def get_orders(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
):
    query = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.vehicle),
            joinedload(Order.quote),
        )
        .join(Customer, Order.customer_id == Customer.id)
        .join(Vehicle, Order.vehicle_id == Vehicle.id)
        .outerjoin(Quote, Order.quote_id == Quote.id)
    )

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Order.code.ilike(search_term),
                Customer.full_name.ilike(search_term),
                Vehicle.plate.ilike(search_term),
                Vehicle.brand.ilike(search_term),
                Vehicle.model.ilike(search_term),
                Quote.code.ilike(search_term),
            )
        )

    if status and status != "Todas":
        query = query.filter(Order.status == status)

    if priority and priority != "Todas":
        query = query.filter(Order.priority == priority)

    return query.order_by(Order.created_on.desc()).all()


def get_order_by_id(db: Session, order_id: uuid.UUID):
    return (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.vehicle),
            joinedload(Order.quote),
        )
        .filter(Order.id == order_id)
        .first()
    )


def create_order(db: Session, payload: OrderCreate):
    order = Order(
        code=generate_order_code(db),
        customer_id=payload.customer_id,
        vehicle_id=payload.vehicle_id,
        quote_id=payload.quote_id,
        created_at=payload.created_at,
        promised_at=payload.promised_at,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        priority=payload.priority.value if hasattr(payload.priority, "value") else payload.priority,
        description=payload.description,
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def update_order(db: Session, db_order: Order, payload: OrderUpdate):
    data = payload.model_dump(exclude_unset=True)

    if "status" in data and hasattr(data["status"], "value"):
        data["status"] = data["status"].value

    if "priority" in data and hasattr(data["priority"], "value"):
        data["priority"] = data["priority"].value

    for field, value in data.items():
        setattr(db_order, field, value)

    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, db_order: Order):
    db.delete(db_order)
    db.commit()