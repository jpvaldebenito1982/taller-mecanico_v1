from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_CORS_ORIGINS = (
    "http://localhost:3001,"
    "http://127.0.0.1:3001,"
    "http://localhost:3000,"
    "http://127.0.0.1:3000"
)


class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_URL: str = "http://localhost:8001"
    CORS_ORIGINS: str = DEFAULT_CORS_ORIGINS
    LIBREDTE_API_BASE_URL: str = "https://libredte.cl/api"
    LIBREDTE_API_KEY: str | None = None
    LIBREDTE_HASH: str | None = None
    LIBREDTE_EMISOR_RUT: str | None = None
    LIBREDTE_USE_CERTIFICATION: bool = True
    LIBREDTE_NORMALIZE: bool = True
    LIBREDTE_PDF_FORMAT: str = "general"
    LIBREDTE_SEND_EMAIL: bool = False
    LIBREDTE_DEFAULT_ITEM_NAME: str = "Servicio taller mecanico"
    LIBREDTE_DEFAULT_BOLETA_RUT: str = Field(default="66666666-6")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


settings = Settings()
