from urllib.parse import quote

import httpx

from app.core.config import settings


def storage_is_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


def _headers() -> dict[str, str]:
    key = settings.SUPABASE_SERVICE_ROLE_KEY or ""
    return {"apikey": key, "Authorization": f"Bearer {key}"}


async def _ensure_public_bucket(client: httpx.AsyncClient) -> None:
    bucket = settings.SUPABASE_STORAGE_BUCKET
    response = await client.get(f"/storage/v1/bucket/{quote(bucket, safe='')}")
    if response.status_code == 404:
        response = await client.post(
            "/storage/v1/bucket",
            json={"id": bucket, "name": bucket, "public": True},
        )
    response.raise_for_status()


async def upload_order_image(
    object_path: str,
    content: bytes,
    content_type: str,
) -> str:
    if not storage_is_configured():
        raise RuntimeError("Supabase Storage no esta configurado.")

    async with httpx.AsyncClient(
        base_url=(settings.SUPABASE_URL or "").rstrip("/"),
        headers=_headers(),
        timeout=30,
    ) as client:
        await _ensure_public_bucket(client)
        response = await client.post(
            f"/storage/v1/object/{quote(settings.SUPABASE_STORAGE_BUCKET, safe='')}/{quote(object_path, safe='/')}",
            content=content,
            headers={**_headers(), "Content-Type": content_type, "x-upsert": "false"},
        )
        response.raise_for_status()

    return f"supabase://{settings.SUPABASE_STORAGE_BUCKET}/{object_path}"


async def delete_order_image(file_path: str) -> None:
    if not file_path.startswith("supabase://") or not storage_is_configured():
        return

    stored_path = file_path.removeprefix("supabase://")
    bucket, _, object_path = stored_path.partition("/")
    if not bucket or not object_path:
        return

    async with httpx.AsyncClient(
        base_url=(settings.SUPABASE_URL or "").rstrip("/"),
        headers=_headers(),
        timeout=30,
    ) as client:
        response = await client.delete(
            f"/storage/v1/object/{quote(bucket, safe='')}/{quote(object_path, safe='/')}"
        )
        if response.status_code != 404:
            response.raise_for_status()


def get_image_url(file_path: str) -> str:
    if file_path.startswith("supabase://") and settings.SUPABASE_URL:
        stored_path = file_path.removeprefix("supabase://")
        bucket, _, object_path = stored_path.partition("/")
        return (
            f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
            f"{quote(bucket, safe='')}/{quote(object_path, safe='/')}"
        )

    filename = file_path.replace("\\", "/").rsplit("/", 1)[-1]
    return f"{settings.BACKEND_URL.rstrip('/')}/uploads/orders/{quote(filename)}"
