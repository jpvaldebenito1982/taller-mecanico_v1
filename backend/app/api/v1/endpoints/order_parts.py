from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud.order import get_order_by_id
from app.crud.order_part import (
    get_order_parts,
    get_order_part_by_id,
    get_inventory_item_for_order_part,
    create_order_part,
    update_order_part,
    delete_order_part,
)
from app.schemas.order_part import (
    OrderPartCreate,
    OrderPartUpdate,
    OrderPartResponse,
)

router = APIRouter(prefix="/orders", tags=["Order Parts"])


def build_order_part_response(order_part, inventory_item) -> OrderPartResponse:
    line_total = Decimal(order_part.quantity) * Decimal(order_part.unit_price)

    return OrderPartResponse(
        id=order_part.id,
        order_id=order_part.order_id,
        inventory_item_id=order_part.inventory_item_id,
        quantity=order_part.quantity,
        unit_price=order_part.unit_price,
        created_at=order_part.created_at,
        updated_at=order_part.updated_at,
        inventory_code=inventory_item.code,
        inventory_name=inventory_item.name,
        inventory_stock=inventory_item.stock,
        line_total=line_total,
    )


@router.get("/{order_id}/parts", response_model=list[OrderPartResponse])
def list_order_parts(order_id: UUID, db: Session = Depends(get_db)):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    parts = get_order_parts(db, order_id)
    response = []

    for part in parts:
        inventory_item = get_inventory_item_for_order_part(db, part.inventory_item_id)
        if inventory_item:
            response.append(build_order_part_response(part, inventory_item))

    return response


@router.post("/{order_id}/parts", response_model=OrderPartResponse, status_code=status.HTTP_201_CREATED)
def create_part_for_order(
    order_id: UUID,
    payload: OrderPartCreate,
    db: Session = Depends(get_db),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    try:
        order_part = create_order_part(db, order_id, payload)
        inventory_item = get_inventory_item_for_order_part(db, order_part.inventory_item_id)
        return build_order_part_response(order_part, inventory_item)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{order_id}/parts/{order_part_id}", response_model=OrderPartResponse)
def update_part_for_order(
    order_id: UUID,
    order_part_id: UUID,
    payload: OrderPartUpdate,
    db: Session = Depends(get_db),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    order_part = get_order_part_by_id(db, order_part_id)
    if not order_part or str(order_part.order_id) != str(order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto de la orden no encontrado",
        )

    try:
        updated = update_order_part(db, order_part, payload)
        inventory_item = get_inventory_item_for_order_part(db, updated.inventory_item_id)
        return build_order_part_response(updated, inventory_item)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{order_id}/parts/{order_part_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part_for_order(
    order_id: UUID,
    order_part_id: UUID,
    db: Session = Depends(get_db),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    order_part = get_order_part_by_id(db, order_part_id)
    if not order_part or str(order_part.order_id) != str(order_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto de la orden no encontrado",
        )

    try:
        delete_order_part(db, order_part)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )