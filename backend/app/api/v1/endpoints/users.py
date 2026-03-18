import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.crud.user import (
    list_users,
    get_user,
    get_user_by_email,
    create_user,
    update_user,
    delete_user,
    to_out,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def api_list_users(db: Session = Depends(get_db)):
    users = list_users(db)
    return [to_out(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
def api_get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return to_out(u)


@router.post("/", response_model=UserOut)
def api_create_user(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="Email ya existe")

    u = create_user(db, payload)
    return to_out(u)


@router.put("/{user_id}", response_model=UserOut)
def api_update_user(user_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # si cambian email, validar duplicado
    if payload.email:
        email = payload.email.strip().lower()
        other = get_user_by_email(db, email)
        if other and other.id != u.id:
            raise HTTPException(status_code=409, detail="Email ya existe")

    u = update_user(db, u, payload)
    return to_out(u)


@router.delete("/{user_id}")
def api_delete_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    u = get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    delete_user(db, u)
    return {"ok": True}