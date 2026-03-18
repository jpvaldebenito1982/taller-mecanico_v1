from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order_part import OrderPart
from app.models.inventory import InventoryItem
from app.schemas.inventory_movement import InventoryMovementCreate
from app.crud.inventory_movement import create_inventory_movement


def get_order_parts(db: Session, order_id):
    return (
        db.query(OrderPart)
        .filter(OrderPart.order_id == order_id)
        .order_by(OrderPart.created_at.asc())
        .all()
    )


def get_order_part_by_id(db: Session, order_part_id):
    return (
        db.query(OrderPart)
        .filter(OrderPart.id == order_part_id)
        .first()
    )


def get_order_part_by_order_and_inventory(db: Session, order_id, inventory_item_id):
    return (
        db.query(OrderPart)
        .filter(
            OrderPart.order_id == order_id,
            OrderPart.inventory_item_id == inventory_item_id,
        )
        .first()
    )


def get_inventory_item_for_order_part(db: Session, inventory_item_id):
    return (
        db.query(InventoryItem)
        .filter(
            InventoryItem.id == inventory_item_id,
            InventoryItem.is_active == True,
        )
        .first()
    )


def create_order_part(db: Session, order_id, payload, created_by=None):
    inventory_item = get_inventory_item_for_order_part(db, payload.inventory_item_id)
    if not inventory_item:
        raise ValueError("Repuesto no encontrado en inventario")

    existing = get_order_part_by_order_and_inventory(db, order_id, payload.inventory_item_id)
    if existing:
        raise ValueError("Ese repuesto ya fue agregado a la orden")

    # 1) Crear la línea de la orden
    order_part = OrderPart(
        order_id=order_id,
        inventory_item_id=payload.inventory_item_id,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
    )
    db.add(order_part)
    db.commit()
    db.refresh(order_part)

    # 2) Registrar salida en inventario
    movement_payload = InventoryMovementCreate(
        inventory_item_id=payload.inventory_item_id,
        movement_type="salida",
        quantity=payload.quantity,
        reference_type="order",
        reference_id=order_id,
        notes="Salida por repuesto agregado a orden",
        created_by=created_by,
    )
    create_inventory_movement(db, movement_payload)

    db.refresh(order_part)
    return order_part


def update_order_part(db: Session, order_part: OrderPart, payload, created_by=None):
    old_quantity = order_part.quantity
    new_quantity = payload.quantity

    # actualizar precio siempre
    order_part.unit_price = payload.unit_price

    if new_quantity == old_quantity:
        db.commit()
        db.refresh(order_part)
        return order_part

    difference = new_quantity - old_quantity

    if difference > 0:
        movement_payload = InventoryMovementCreate(
            inventory_item_id=order_part.inventory_item_id,
            movement_type="salida",
            quantity=difference,
            reference_type="order",
            reference_id=order_part.order_id,
            notes="Salida por aumento de cantidad en orden",
            created_by=created_by,
        )
        create_inventory_movement(db, movement_payload)

    elif difference < 0:
        movement_payload = InventoryMovementCreate(
            inventory_item_id=order_part.inventory_item_id,
            movement_type="entrada",
            quantity=abs(difference),
            reference_type="order",
            reference_id=order_part.order_id,
            notes="Devolución por disminución de cantidad en orden",
            created_by=created_by,
        )
        create_inventory_movement(db, movement_payload)

    order_part.quantity = new_quantity
    db.commit()
    db.refresh(order_part)
    return order_part


def delete_order_part(db: Session, order_part: OrderPart, created_by=None):
    # devolver stock completo al eliminar la línea
    movement_payload = InventoryMovementCreate(
        inventory_item_id=order_part.inventory_item_id,
        movement_type="entrada",
        quantity=order_part.quantity,
        reference_type="order",
        reference_id=order_part.order_id,
        notes="Devolución por eliminación de repuesto de la orden",
        created_by=created_by,
    )
    create_inventory_movement(db, movement_payload)

    db.delete(order_part)
    db.commit()