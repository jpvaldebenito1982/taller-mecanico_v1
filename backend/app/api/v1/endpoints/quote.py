import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud.quote import (
    get_quotes,
    get_quote_by_id,
    create_quote,
    update_quote,
    delete_quote,
)
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteResponse

router = APIRouter(prefix="/quotes", tags=["Quotes"])


def build_vehicle_name(vehicle) -> str:
    if not vehicle:
        return ""

    parts = [
        getattr(vehicle, "brand", None),
        getattr(vehicle, "model", None),
        str(vehicle.year) if getattr(vehicle, "year", None) else None,
    ]
    return " ".join([p for p in parts if p])


def serialize_quote(quote) -> QuoteResponse:
    customer_name = (
        quote.customer.full_name
        if getattr(quote, "customer", None)
        else (quote.customer_name or "")
    )

    vehicle_name = (
        build_vehicle_name(quote.vehicle)
        if getattr(quote, "vehicle", None)
        else (quote.vehicle_text or "")
    )

    plate = (
        quote.vehicle.plate
        if getattr(quote, "vehicle", None)
        else (quote.plate or "")
    )

    return QuoteResponse(
        id=quote.id,
        code=quote.code,
        customer_id=quote.customer_id,
        vehicle_id=quote.vehicle_id,
        customer=customer_name,
        vehicle=vehicle_name,
        plate=plate,
        created_at=quote.created_at,
        valid_until=quote.valid_until,
        status=quote.status,
        total=quote.total,
        notes=quote.notes,
    )


@router.get("", response_model=list[QuoteResponse])
def list_quotes(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    quotes = get_quotes(db=db, search=search, status=status)
    return [serialize_quote(q) for q in quotes]


@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote(quote_id: uuid.UUID, db: Session = Depends(get_db)):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado",
        )
    return serialize_quote(quote)


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
def create_new_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    quote = create_quote(db, payload)
    return serialize_quote(quote)


@router.put("/{quote_id}", response_model=QuoteResponse)
def update_existing_quote(
    quote_id: uuid.UUID,
    payload: QuoteUpdate,
    db: Session = Depends(get_db),
):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado",
        )

    updated = update_quote(db, quote, payload)
    return serialize_quote(updated)


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_quote(quote_id: uuid.UUID, db: Session = Depends(get_db)):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado",
        )

    delete_quote(db, quote)
    return None