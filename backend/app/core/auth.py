from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import RedirectResponse, JSONResponse
from app.core.config import settings
from app.services.jwt_service import create_access_token
from app.db.session import async_session
from app.models.models import User
from sqlmodel import select

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

router = APIRouter()

@router.get("/auth/google/login")
async def login(request: Request):
    redirect_uri = f"{settings.BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)

    email = user_info.get("email")
    full_name = user_info.get("name")

    async with async_session() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalars().first()
        if not user:
            user = User(email=email, full_name=full_name, role="mechanic")
            session.add(user)
            await session.commit()
            await session.refresh(user)
        # Genera JWT para el frontend
        access_token = create_access_token(subject=str(user.id))
        # redirige al frontend con token en query string (podrías preferir cookie segura)
        redirect_url = f"{settings.FRONTEND_URL}/auth/success?token={access_token}"
        return RedirectResponse(url=redirect_url)

