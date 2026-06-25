from __future__ import annotations

from base64 import b64encode
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


LIBREDTE_FACTURA_ELECTRONICA = 33
LIBREDTE_BOLETA_ELECTRONICA = 39


@dataclass
class LibreDTEDocumentResult:
    payload: dict[str, Any]
    temporary: dict[str, Any]
    generated: dict[str, Any]
    document_type_code: int
    folio: int | None
    generation_code: str | None
    pdf_path: str | None
    xml_path: str | None
    message: str


def _clean_url(value: str) -> str:
    return value.rstrip("/")


def _query_params(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    params: dict[str, Any] = {}
    if settings.LIBREDTE_USE_CERTIFICATION:
        params["_contribuyente_certificacion"] = 1
    if extra:
        params.update(extra)
    return params


def _authorization_header() -> str:
    if settings.LIBREDTE_API_KEY:
        return f"Basic {settings.LIBREDTE_API_KEY}"

    if settings.LIBREDTE_HASH:
        encoded = b64encode(f"X:{settings.LIBREDTE_HASH}".encode("utf-8")).decode("utf-8")
        return f"Basic {encoded}"

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="LibreDTE no esta configurado. Falta LIBREDTE_API_KEY o LIBREDTE_HASH.",
    )


def ensure_libredte_is_configured() -> None:
    _authorization_header()

    if not settings.LIBREDTE_EMISOR_RUT:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LibreDTE no esta configurado. Falta LIBREDTE_EMISOR_RUT.",
        )


def _headers(accept: str = "application/json") -> dict[str, str]:
    return {
        "Authorization": _authorization_header(),
        "Accept": accept,
        "Content-Type": "application/json",
    }


def _extract_nested_string(data: Any, keys: tuple[str, ...]) -> str | None:
    if isinstance(data, dict):
        for key in keys:
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        links = data.get("links")
        if isinstance(links, dict):
            nested = _extract_nested_string(links, keys)
            if nested:
                return nested

        for value in data.values():
            nested = _extract_nested_string(value, keys)
            if nested:
                return nested

    if isinstance(data, list):
        for item in data:
            nested = _extract_nested_string(item, keys)
            if nested:
                return nested

    return None


def _extract_generation_code(data: Any) -> str | None:
    if isinstance(data, dict):
        for key in ("codigo", "codigo_generacion", "track_id", "trackid"):
            value = data.get(key)
            if value not in (None, ""):
                return str(value)

        for value in data.values():
            nested = _extract_generation_code(value)
            if nested:
                return nested

    if isinstance(data, list):
        for item in data:
            nested = _extract_generation_code(item)
            if nested:
                return nested

    return None


def _extract_folio(data: Any) -> int | None:
    if isinstance(data, dict):
        for key in ("folio", "numero", "numero_documento"):
            value = data.get(key)
            if value not in (None, ""):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    continue

        for value in data.values():
            nested = _extract_folio(value)
            if nested is not None:
                return nested

    if isinstance(data, list):
        for item in data:
            nested = _extract_folio(item)
            if nested is not None:
                return nested

    return None


def _extract_message(data: Any) -> str:
    if isinstance(data, dict):
        for key in ("message", "mensaje", "glosa", "detalle"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return "Documento procesado en LibreDTE."


def _raise_libredte_error(response: httpx.Response) -> None:
    detail = "LibreDTE rechazo la solicitud."
    try:
        payload = response.json()
    except ValueError:
        payload = response.text

    if isinstance(payload, dict):
        detail = str(
            payload.get("detail")
            or payload.get("message")
            or payload.get("mensaje")
            or detail
        )
    elif isinstance(payload, str) and payload.strip():
        detail = payload.strip()

    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


def _request_json(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    payload: Any = None,
) -> dict[str, Any]:
    ensure_libredte_is_configured()
    url = f"{_clean_url(settings.LIBREDTE_API_BASE_URL)}{path}"

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.request(
                method,
                url,
                params=_query_params(params),
                json=payload,
                headers=_headers(),
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"No fue posible comunicarse con LibreDTE: {exc}",
        ) from exc

    if response.status_code >= 400:
        _raise_libredte_error(response)

    data = response.json()
    return data if isinstance(data, dict) else {"data": data}


def emit_document(payload: dict[str, Any]) -> LibreDTEDocumentResult:
    temporary = _request_json(
        "POST",
        "/dte/documentos/emitir",
        params={
            "normalizar": 1 if settings.LIBREDTE_NORMALIZE else 0,
            "formato": "json",
            "links": 1,
            "email": 1 if settings.LIBREDTE_SEND_EMAIL else 0,
        },
        payload=payload,
    )

    generation_code = _extract_generation_code(temporary)
    if not generation_code:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LibreDTE no devolvio el codigo temporal necesario para generar el DTE real.",
        )

    body = {
        "emisor": int(settings.LIBREDTE_EMISOR_RUT.split("-")[0]),
        "receptor": int(str(payload["Encabezado"]["Receptor"]["RUTRecep"]).split("-")[0]),
        "dte": int(payload["Encabezado"]["IdDoc"]["TipoDTE"]),
        "codigo": generation_code,
    }

    generated = _request_json(
        "POST",
        "/dte/documentos/generar",
        params={
            "getXML": 0,
            "links": 1,
            "email": 1 if settings.LIBREDTE_SEND_EMAIL else 0,
            "retry": 10,
            "gzip": 0,
        },
        payload=body,
    )

    return LibreDTEDocumentResult(
        payload=payload,
        temporary=temporary,
        generated=generated,
        document_type_code=int(payload["Encabezado"]["IdDoc"]["TipoDTE"]),
        folio=_extract_folio(generated) or _extract_folio(temporary),
        generation_code=_extract_generation_code(generated) or generation_code,
        pdf_path=_extract_nested_string(generated, ("pdf", "pdf_path", "pdf_url", "url_pdf", "enlace_pdf"))
        or _extract_nested_string(temporary, ("pdf", "pdf_path", "pdf_url", "url_pdf", "enlace_pdf")),
        xml_path=_extract_nested_string(generated, ("xml", "xml_path", "xml_url", "url_xml", "enlace_xml"))
        or _extract_nested_string(temporary, ("xml", "xml_path", "xml_url", "url_xml", "enlace_xml")),
        message=_extract_message(generated),
    )


def fetch_document_status(document_type_code: int, folio: int, emisor_rut: str | None = None) -> dict[str, Any]:
    rut = emisor_rut or settings.LIBREDTE_EMISOR_RUT
    if not rut:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falta LIBREDTE_EMISOR_RUT para consultar el estado del DTE.",
        )

    return _request_json(
        "GET",
        f"/dte/dte_emitidos/info/{document_type_code}/{folio}/{rut}",
    )


def download_document_pdf(document_type_code: int, folio: int, emisor_rut: str | None = None) -> bytes:
    rut = emisor_rut or settings.LIBREDTE_EMISOR_RUT
    if not rut:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falta LIBREDTE_EMISOR_RUT para obtener el PDF del DTE.",
        )

    ensure_libredte_is_configured()
    url = (
        f"{_clean_url(settings.LIBREDTE_API_BASE_URL)}"
        f"/dte/dte_emitidos/pdf/{document_type_code}/{folio}/{rut}"
    )

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.get(
                url,
                params=_query_params(
                    {
                        "formato": settings.LIBREDTE_PDF_FORMAT,
                        "papelContinuo": 0,
                    }
                ),
                headers=_headers(accept="application/pdf"),
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"No fue posible descargar el PDF desde LibreDTE: {exc}",
        ) from exc

    if response.status_code >= 400:
        _raise_libredte_error(response)

    return response.content
