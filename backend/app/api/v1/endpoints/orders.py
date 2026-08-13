# app/api/v1/endpoints/orders.py
import os
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.crud.order import (
    get_orders,
    get_order_by_id,
    create_order,
    update_order,
    delete_order,
)
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
)

# AJUSTA ESTE IMPORT SEGÚN TU PROYECTO
from app.models.order_image import OrderImage

router = APIRouter(prefix="/orders", tags=["Orders"])

UPLOAD_DIR = "uploads/orders"
os.makedirs(UPLOAD_DIR, exist_ok=True)

API_BASE_URL = settings.BACKEND_URL.rstrip("/")
MAX_IMAGE_SIZE = 12 * 1024 * 1024


def build_vehicle_name(vehicle) -> str:
    if not vehicle:
        return ""

    parts = [
        getattr(vehicle, "brand", None),
        getattr(vehicle, "model", None),
        str(vehicle.year) if getattr(vehicle, "year", None) else None,
    ]
    return " ".join([p for p in parts if p])




def serialize_order(order) -> OrderResponse:
    images = []

    if getattr(order, "images", None):
        for image in order.images:
            filename = os.path.basename(image.file_path)
            images.append(
                {
                    "id": image.id,
                    "file_name": image.file_name,
                    "file_url": f"{API_BASE_URL}/uploads/orders/{filename}",
                }
            )

    return OrderResponse(
        id=order.id,
        code=order.code,
        plate=order.vehicle.plate if getattr(order, "vehicle", None) else "",
        vehicle=build_vehicle_name(order.vehicle) if getattr(order, "vehicle", None) else "",
        customer=order.customer.full_name if getattr(order, "customer", None) else "",
        created_at=order.created_at,
        promised_at=order.promised_at,
        status=order.status,
        description=order.description,
        phone=customer.phone if (customer := getattr(order, "customer", None)) else None,
        priority=order.priority,
        total=order.total,
        quote_id=order.quote_id,
        quote_code=order.quote.code if getattr(order, "quote", None) else None,
        images=images,
    )


@router.get("", response_model=list[OrderResponse])
def list_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
):
    orders = get_orders(
        db=db,
        search=search,
        status=status,
        priority=priority,
    )
    return [serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )
    return serialize_order(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    customer_id: uuid.UUID = Form(...),
    vehicle_id: uuid.UUID = Form(...),
    quote_id: Optional[uuid.UUID] = Form(None),
    created_at: date = Form(...),
    promised_at: Optional[date] = Form(None),
    priority: str = Form(...),
    status: str = Form(...),
    description: str = Form(...),
    phone: Optional[str] = Form(None),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    try:
        payload = OrderCreate(
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            quote_id=quote_id,
            created_at=created_at,
            promised_at=promised_at,
            priority=priority,
            status=status,
            description=description,
        )

        order = create_order(db, payload)

        for image in images:
            extension = os.path.splitext(image.filename or "")[1]
            safe_filename = f"{uuid.uuid4()}{extension or '.jpg'}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            content = await image.read()
            with open(file_path, "wb") as f:
                f.write(content)

            db.add(
                OrderImage(
                    order_id=order.id,
                    file_name=image.filename or safe_filename,
                    file_path=file_path,
                    content_type=image.content_type,
                )
            )

        db.commit()

        order = get_order_by_id(db, order.id)
        return serialize_order(order)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo crear la orden: {str(e)}",
        )


@router.put("/{order_id}", response_model=OrderResponse)
def update_existing_order(
    order_id: uuid.UUID,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    updated = update_order(db, order, payload)
    updated = get_order_by_id(db, updated.id)
    return serialize_order(updated)


@router.put("/{order_id}/with-images", response_model=OrderResponse)
async def update_order_with_images(
    order_id: uuid.UUID,
    created_at: date = Form(...),
    promised_at: str = Form(""),
    status_value: str = Form(..., alias="status"),
    priority: str = Form(...),
    description: str = Form(...),
    deleted_image_ids: list[uuid.UUID] = Form(default=[]),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    created_files: list[str] = []

    try:
        payload = OrderUpdate(
            created_at=created_at,
            promised_at=date.fromisoformat(promised_at) if promised_at else None,
            status=status_value,
            priority=priority,
            description=description,
        )

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(order, field, value.value if hasattr(value, "value") else value)

        if deleted_image_ids:
            existing_images = (
                db.query(OrderImage)
                .filter(
                    OrderImage.order_id == order.id,
                    OrderImage.id.in_(deleted_image_ids),
                )
                .all()
            )
            for existing_image in existing_images:
                if os.path.isfile(existing_image.file_path):
                    os.remove(existing_image.file_path)
                db.delete(existing_image)

        for image in images:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{image.filename or 'Archivo'} no es una imagen valida.",
                )

            extension = os.path.splitext(image.filename or "")[1]
            safe_filename = f"{uuid.uuid4()}{extension or '.jpg'}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            size = 0
            created_files.append(file_path)

            with open(file_path, "wb") as output:
                while chunk := await image.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_IMAGE_SIZE:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"{image.filename or 'La imagen'} supera los 12 MB.",
                        )
                    output.write(chunk)

            db.add(
                OrderImage(
                    order_id=order.id,
                    file_name=image.filename or safe_filename,
                    file_path=file_path,
                    content_type=image.content_type,
                )
            )

        db.commit()
        return serialize_order(get_order_by_id(db, order.id))
    except HTTPException:
        db.rollback()
        for file_path in created_files:
            if os.path.isfile(file_path):
                os.remove(file_path)
        raise
    except Exception as exc:
        db.rollback()
        for file_path in created_files:
            if os.path.isfile(file_path):
                os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo actualizar la orden: {exc}",
        ) from exc


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada",
        )

    delete_order(db, order)
    return None
