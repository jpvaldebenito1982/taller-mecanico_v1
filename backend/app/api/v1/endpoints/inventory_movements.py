from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.crud.inventory_movement import (
    get_inventory_movements,
    get_inventory_movement_by_id,
    get_inventory_item_for_movement,
    create_inventory_movement,
)
from app.schemas.inventory_movement import (
    InventoryMovementCreate,
    InventoryMovementResponse,
)

router = APIRouter(prefix="/inventory-movements", tags=["Inventory Movements"])


def build_inventory_movement_response(movement, inventory_item) -> InventoryMovementResponse:
    return InventoryMovementResponse(
        id=movement.id,
        inventory_item_id=movement.inventory_item_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        reference_type=movement.reference_type,
        reference_id=movement.reference_id,
        notes=movement.notes,
        created_by=movement.created_by,
        created_at=movement.created_at,
        inventory_code=inventory_item.code,
        inventory_name=inventory_item.name,
        resulting_stock=inventory_item.stock,
    )


@router.get("", response_model=list[InventoryMovementResponse])
def list_inventory_movements(
    inventory_item_id: UUID | None = None,
    reference_type: str | None = None,
    reference_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    movements = get_inventory_movements(
        db=db,
        inventory_item_id=inventory_item_id,
        reference_type=reference_type,
        reference_id=reference_id,
    )

    response = []
    for movement in movements:
        inventory_item = get_inventory_item_for_movement(db, movement.inventory_item_id)
        if inventory_item:
            response.append(build_inventory_movement_response(movement, inventory_item))

    return response


@router.get("/{movement_id}", response_model=InventoryMovementResponse)
def get_inventory_movement(movement_id: UUID, db: Session = Depends(get_db)):
    movement = get_inventory_movement_by_id(db, movement_id)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimiento no encontrado",
        )

    inventory_item = get_inventory_item_for_movement(db, movement.inventory_item_id)
    if not inventory_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado en inventario",
        )

    return build_inventory_movement_response(movement, inventory_item)


@router.post("", response_model=InventoryMovementResponse, status_code=status.HTTP_201_CREATED)
def create_new_inventory_movement(
    payload: InventoryMovementCreate,
    db: Session = Depends(get_db),
):
    try:
        movement, inventory_item = create_inventory_movement(db, payload)
        return build_inventory_movement_response(movement, inventory_item)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )