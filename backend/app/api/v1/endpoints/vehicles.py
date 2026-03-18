import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.crud.vehicle import (
    list_vehicles,
    list_vehicles_by_customer,
    get_vehicle_by_plate, 
    get_vehicle,
    create_vehicle,
    update_vehicle,
    delete_vehicle,
)

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/", response_model=list[VehicleOut])
def api_list(
    customer_id: uuid.UUID | None = Query(None),
    plate: str | None = Query(None),   # <-- agrega
    db: Session = Depends(get_db),
):
    if plate:
        v = get_vehicle_by_plate(db, plate)
        return [v] if v else []
    return list_vehicles_by_customer(db, customer_id) if customer_id else list_vehicles(db)

@router.get("/{vehicle_id}", response_model=VehicleOut)
def api_get(vehicle_id: uuid.UUID, db: Session = Depends(get_db)):
    v = get_vehicle(db, vehicle_id)
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    return v

@router.post("/", response_model=VehicleOut)
def api_create(payload: VehicleCreate, db: Session = Depends(get_db)):
    return create_vehicle(db, payload)

@router.put("/{vehicle_id}", response_model=VehicleOut)
def api_update(vehicle_id: uuid.UUID, payload: VehicleUpdate, db: Session = Depends(get_db)):
    v = update_vehicle(db, vehicle_id, payload)
    if not v:
        raise HTTPException(404, "Vehículo no encontrado")
    return v

@router.delete("/{vehicle_id}")
def api_delete(vehicle_id: uuid.UUID, db: Session = Depends(get_db)):
    ok = delete_vehicle(db, vehicle_id)
    if not ok:
        raise HTTPException(404, "Vehículo no encontrado")
    return {"ok": True}