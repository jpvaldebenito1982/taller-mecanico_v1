from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.quote import Quote
from app.schemas.quote import QuoteCreate, QuoteUpdate


def generate_quote_code(db: Session) -> str:
    last_quote = (
        db.query(Quote)
        .order_by(Quote.created_on.desc())
        .first()
    )

    if not last_quote or not last_quote.code:
        return "P-00001"

    try:
        last_number = int(last_quote.code.split("-")[-1])
    except Exception:
        last_number = 0

    return f"P-{last_number + 1:05d}"


def get_quotes(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    query = db.query(Quote)

    if status:
        query = query.filter(Quote.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Quote.code.ilike(term),
                Quote.customer_name.ilike(term),
                Quote.vehicle_text.ilike(term),
                Quote.plate.ilike(term),
            )
        )

    return query.order_by(Quote.created_on.desc()).all()


def get_quote_by_id(db: Session, quote_id):
    return db.query(Quote).filter(Quote.id == quote_id).first()


def create_quote(db: Session, payload: QuoteCreate):
    code = generate_quote_code(db)

    quote = Quote(
        code=code,
        customer_id=payload.customer_id,
        vehicle_id=payload.vehicle_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=str(payload.customer_email) if payload.customer_email else None,
        vehicle_text=payload.vehicle_text,
        plate=payload.plate,
        created_at=payload.created_at,
        valid_until=payload.valid_until,
        status=payload.status,
        total=payload.total,
        notes=payload.notes,
    )

    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def update_quote(db: Session, quote: Quote, payload: QuoteUpdate):
    data = payload.model_dump(exclude_unset=True)

    if "customer_email" in data and data["customer_email"] is not None:
        data["customer_email"] = str(data["customer_email"])

    for field, value in data.items():
        setattr(quote, field, value)

    db.commit()
    db.refresh(quote)
    return quote


def delete_quote(db: Session, quote: Quote):
    db.delete(quote)
    db.commit()