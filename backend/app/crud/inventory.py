from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.inventory import InventoryItem
from app.schemas.inventory import InventoryCreate, InventoryUpdate


def get_stock_status(stock: int, min_stock: int) -> str:
    if stock <= 0:
        return "Sin stock"
    if stock <= min_stock:
        return "Bajo"
    return "OK"


def get_inventory_items(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    stock_status: Optional[str] = None,
):
    query = db.query(InventoryItem).filter(InventoryItem.is_active == True)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InventoryItem.code.ilike(search_term),
                InventoryItem.barcode.ilike(search_term),
                InventoryItem.name.ilike(search_term),
                InventoryItem.category.ilike(search_term),
                InventoryItem.location.ilike(search_term),
                InventoryItem.supplier.ilike(search_term),
            )
        )

    if category and category != "Todas":
        query = query.filter(InventoryItem.category == category)

    items = query.order_by(InventoryItem.created_at.desc()).all()

    if stock_status and stock_status != "Todos":
        items = [
            item for item in items
            if get_stock_status(item.stock, item.min_stock) == stock_status
        ]

    return items


def get_inventory_categories(db: Session):
    rows = (
        db.query(InventoryItem.category)
        .filter(InventoryItem.is_active == True)
        .distinct()
        .order_by(InventoryItem.category.asc())
        .all()
    )
    return [row[0] for row in rows]


def get_inventory_item_by_id(db: Session, item_id: str):
    return (
        db.query(InventoryItem)
        .filter(
            InventoryItem.id == item_id,
            InventoryItem.is_active == True,
        )
        .first()
    )


def get_inventory_item_by_code(db: Session, code: str):
    return (
        db.query(InventoryItem)
        .filter(InventoryItem.code == code)
        .first()
    )


def get_inventory_item_by_barcode(db: Session, barcode: str):
    return (
        db.query(InventoryItem)
        .filter(
            InventoryItem.barcode == barcode,
            InventoryItem.is_active == True,
        )
        .first()
    )


def create_inventory_item(db: Session, payload: InventoryCreate):
    item = InventoryItem(
        code=payload.code,
        barcode=payload.barcode,
        name=payload.name,
        category=payload.category,
        stock=payload.stock,
        min_stock=payload.min_stock,
        location=payload.location,
        unit_cost=payload.unit_cost,
        unit_price=payload.unit_price,
        supplier=payload.supplier,
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_inventory_item(
    db: Session,
    item: InventoryItem,
    payload: InventoryUpdate,
):
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


def delete_inventory_item(db: Session, item: InventoryItem):
    item.is_active = False
    db.commit()
    return item