// src/lib/api.ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;
  const url = `${apiBaseUrl}${apiPath}`;

  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
