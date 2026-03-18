from sqlalchemy.orm import Session

from app.models.inventory import InventoryItem
from app.models.inventory_movement import InventoryMovement
from app.schemas.inventory_movement import InventoryMovementCreate


def get_inventory_movements(
    db: Session,
    inventory_item_id=None,
    reference_type=None,
    reference_id=None,
):
    query = db.query(InventoryMovement)

    if inventory_item_id:
        query = query.filter(InventoryMovement.inventory_item_id == inventory_item_id)

    if reference_type:
        query = query.filter(InventoryMovement.reference_type == reference_type)

    if reference_id:
        query = query.filter(InventoryMovement.reference_id == reference_id)

    return query.order_by(InventoryMovement.created_at.desc()).all()


def get_inventory_movement_by_id(db: Session, movement_id):
    return (
        db.query(InventoryMovement)
        .filter(InventoryMovement.id == movement_id)
        .first()
    )


def get_inventory_item_for_movement(db: Session, inventory_item_id):
    return (
        db.query(InventoryItem)
        .filter(
            InventoryItem.id == inventory_item_id,
            InventoryItem.is_active == True,
        )
        .first()
    )


def apply_stock_change(item: InventoryItem, movement_type: str, quantity: int):
    if movement_type == "entrada":
        item.stock += quantity
        return

    if movement_type == "salida":
        if item.stock < quantity:
            raise ValueError("Stock insuficiente para registrar la salida")
        item.stock -= quantity
        return

    if movement_type == "ajuste":
        item.stock += quantity
        return

    raise ValueError("Tipo de movimiento no válido")


def create_inventory_movement(db: Session, payload: InventoryMovementCreate):
    item = get_inventory_item_for_movement(db, payload.inventory_item_id)
    if not item:
        raise ValueError("Repuesto no encontrado en inventario")

    apply_stock_change(item, payload.movement_type, payload.quantity)

    movement = InventoryMovement(
        inventory_item_id=payload.inventory_item_id,
        movement_type=payload.movement_type,
        quantity=payload.quantity,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        notes=payload.notes,
        created_by=payload.created_by,
    )

    db.add(movement)
    db.commit()
    db.refresh(movement)
    db.refresh(item)

    return movement, item