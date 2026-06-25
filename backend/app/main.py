from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from fastapi.staticfiles import StaticFiles

app = FastAPI()

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
