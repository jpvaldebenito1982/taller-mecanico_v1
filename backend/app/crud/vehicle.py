import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.schemas.vehicle import VehicleCreate, VehicleUpdate

def _to_out(v: Vehicle) -> dict:
    c = v.customer  # lazy="joined"
    return {
        "id": v.id,
        "customer_id": v.customer_id,
        "customer_name": c.full_name if c else "",
        "customer_email": c.email if c else None,
        "customer_phone": c.phone if c else None,
        "plate": v.plate,
        "brand": v.brand,
        "model": v.model,
        "year": v.year,
        "color": v.color,
        "mileage_km": v.mileage_km,
        "notes": v.notes,
    }

def list_vehicles(db: Session) -> list[dict]:
    rows = db.execute(select(Vehicle).order_by(Vehicle.created_at.desc())).scalars().all()
    return [_to_out(v) for v in rows]

def list_vehicles_by_customer(db: Session, customer_id: uuid.UUID) -> list[dict]:
    rows = db.execute(
        select(Vehicle).where(Vehicle.customer_id == customer_id).order_by(Vehicle.created_at.desc())
    ).scalars().all()
    return [_to_out(v) for v in rows]

def get_vehicle(db: Session, vehicle_id: uuid.UUID) -> dict | None:
    v = db.get(Vehicle, vehicle_id)
    if not v:
        return None
    return _to_out(v)

def create_vehicle(db: Session, data: VehicleCreate) -> dict:
    obj = Vehicle(
        customer_id=data.customer_id,
        plate=data.plate.strip().upper(),
        brand=data.brand.strip() if data.brand else None,
        model=data.model.strip() if data.model else None,
        year=data.year,
        color=data.color.strip() if data.color else None,
        mileage_km=data.mileage_km,
        notes=data.notes,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)

def update_vehicle(db: Session, vehicle_id: uuid.UUID, data: VehicleUpdate) -> dict | None:
    obj: Vehicle | None = db.get(Vehicle, vehicle_id)
    if not obj:
        return None

    if data.customer_id is not None:
        obj.customer_id = data.customer_id
    if data.plate is not None:
        obj.plate = data.plate.strip().upper()
    if data.brand is not None:
        obj.brand = data.brand.strip() if data.brand else None
    if data.model is not None:
        obj.model = data.model.strip() if data.model else None
    if data.year is not None:
        obj.year = data.year
    if data.color is not None:
        obj.color = data.color.strip() if data.color else None
    if data.mileage_km is not None:
        obj.mileage_km = data.mileage_km
    if data.notes is not None:
        obj.notes = data.notes

    db.commit()
    db.refresh(obj)
    return _to_out(obj)

def delete_vehicle(db: Session, vehicle_id: uuid.UUID) -> bool:
    obj = db.get(Vehicle, vehicle_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def get_vehicle_by_plate(db: Session, plate: str) -> dict | None:
    norm = plate.strip().upper()
    v = db.execute(select(Vehicle).where(Vehicle.plate == norm)).scalar_one_or_none()
    return _to_out(v) if v else None