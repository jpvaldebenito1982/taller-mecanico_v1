from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from app.api.router import api_router
from app.core.config import settings
from app.services.jwt_service import decode_token
from fastapi.staticfiles import StaticFiles

app = FastAPI()


@app.middleware("http")
async def require_api_authentication(request: Request, call_next):
    path = request.url.path
    is_protected_api = path.startswith("/api/")
    is_auth_check = path == "/api/users/auth-check"

    if is_protected_api and not is_auth_check and request.method != "OPTIONS":
        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")

        if scheme.lower() != "bearer" or not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Autenticacion requerida."},
            )

        try:
            payload = decode_token(token)
            if not payload.get("sub"):
                raise JWTError("Missing subject")
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token invalido o vencido."},
            )

    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok"}
