from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.inventory import (
    get_inventory_items,
    get_inventory_categories,
    get_inventory_item_by_id,
    get_inventory_item_by_code,
    get_inventory_item_by_barcode,
    create_inventory_item,
    update_inventory_item,
    delete_inventory_item,
    get_stock_status,
)
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
)
from app.db.session import get_db

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def build_response(item) -> InventoryResponse:
    return InventoryResponse(
        id=item.id,
        code=item.code,
        barcode=item.barcode,
        name=item.name,
        category=item.category,
        stock=item.stock,
        min_stock=item.min_stock,
        location=item.location,
        unit_cost=item.unit_cost,
        unit_price=item.unit_price,
        supplier=item.supplier,
        is_active=item.is_active,
        stock_status=get_stock_status(item.stock, item.min_stock),
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    search: str | None = Query(None),
    category: str | None = Query(None),
    stock_status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    items = get_inventory_items(
        db=db,
        search=search,
        category=category,
        stock_status=stock_status,
    )
    return [build_response(item) for item in items]


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    return get_inventory_categories(db)


@router.get("/barcode/{barcode}", response_model=InventoryResponse)
def get_inventory_by_barcode(barcode: str, db: Session = Depends(get_db)):
    item = get_inventory_item_by_barcode(db, barcode)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado",
        )

    return build_response(item)


@router.get("/{item_id}", response_model=InventoryResponse)
def get_inventory(item_id: str, db: Session = Depends(get_db)):
    item = get_inventory_item_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado",
        )

    return build_response(item)


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    existing = get_inventory_item_by_code(db, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un repuesto con ese código",
        )

    if payload.barcode:
        existing_barcode = get_inventory_item_by_barcode(db, payload.barcode)
        if existing_barcode:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un repuesto con ese código de barras",
            )

    item = create_inventory_item(db, payload)
    return build_response(item)


@router.put("/{item_id}", response_model=InventoryResponse)
def update_inventory(
    item_id: str,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
):
    item = get_inventory_item_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado",
        )

    if payload.code and payload.code != item.code:
        existing = get_inventory_item_by_code(db, payload.code)
        if existing and str(existing.id) != str(item.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un repuesto con ese código",
            )

    if payload.barcode and payload.barcode != item.barcode:
        existing_barcode = get_inventory_item_by_barcode(db, payload.barcode)
        if existing_barcode and str(existing_barcode.id) != str(item.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un repuesto con ese código de barras",
            )

    updated_item = update_inventory_item(db, item, payload)
    return build_response(updated_item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(item_id: str, db: Session = Depends(get_db)):
    item = get_inventory_item_by_id(db, item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado",
        )

    delete_inventory_item(db, item)
    return None