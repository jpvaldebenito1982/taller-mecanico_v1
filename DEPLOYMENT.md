# Despliegue en Supabase + Vercel

Esta app tiene tres piezas en produccion:

1. Base de datos PostgreSQL en Supabase.
2. Backend FastAPI en un host Python, por ejemplo Render, Railway o Fly.io.
3. Frontend Next.js en Vercel.

Supabase reemplaza la base de datos, pero no hospeda este backend FastAPI tal como esta escrito.

## 1. Supabase

1. Crear un proyecto en Supabase.
2. Ir a **Project Settings > Database > Connection string**.
3. Copiar una connection string compatible con PostgreSQL.

Para un backend persistente como FastAPI, usa preferentemente **Direct connection** o **Session pooler**. Evita Transaction pooler salvo que ajustes la libreria para no usar prepared statements.

Formato para `DATABASE_URL`:

```env
DATABASE_URL=postgresql+psycopg://USUARIO:PASSWORD@HOST:PUERTO/postgres
```

Ejemplo orientativo:

```env
DATABASE_URL=postgresql+psycopg://postgres.xxxxx:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

La app usa el schema:

```sql
"Taller_mecanico"
```

Antes de apuntar el backend productivo a Supabase, hay que crear las tablas en Supabase. La forma mas directa es exportar/importar la base local:

```powershell
pg_dump --schema "Taller_mecanico" --schema-only --file taller_schema.sql "postgresql://USUARIO:PASS@localhost:5432/postgres"
psql "postgresql://USUARIO:PASS@HOST:PUERTO/postgres" --file taller_schema.sql
```

Si quieres migrar datos tambien, cambia `--schema-only` por un dump completo o usa `--data-only` despues de crear el schema.

## 2. Backend FastAPI

Desplegar la carpeta `backend` en un host que soporte Python.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Variables de entorno necesarias:

```env
DATABASE_URL=postgresql+psycopg://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=https://TU-FRONTEND.vercel.app
BACKEND_URL=https://TU-BACKEND.example.com
CORS_ORIGINS=https://TU-FRONTEND.vercel.app,http://localhost:3001
LIBREDTE_API_BASE_URL=https://libredte.cl/api
LIBREDTE_API_KEY=...
LIBREDTE_HASH=...
LIBREDTE_EMISOR_RUT=...
LIBREDTE_USE_CERTIFICATION=true
LIBREDTE_NORMALIZE=true
LIBREDTE_PDF_FORMAT=general
LIBREDTE_SEND_EMAIL=false
LIBREDTE_DEFAULT_ITEM_NAME=Servicio taller mecanico
LIBREDTE_DEFAULT_BOLETA_RUT=66666666-6
```

Notas:

- `CORS_ORIGINS` es una lista separada por comas.
- `BACKEND_URL` debe ser la URL publica del backend; se usa para construir URLs de imagenes subidas.
- La carpeta `uploads` es local al servidor. En hosts con filesystem efimero, las imagenes pueden perderse al redeploy. Para produccion robusta conviene moverlas a Supabase Storage o S3.

## 3. Frontend Vercel

En Vercel, importar el repo y configurar:

- Framework: Next.js.
- Root Directory: `frontend`.
- Build command: `npm run build`.
- Output: Next.js default.

Variables de entorno:

```env
NEXT_PUBLIC_API_URL=https://TU-BACKEND.example.com
NEXTAUTH_URL=https://TU-FRONTEND.vercel.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Importante:

- `NEXT_PUBLIC_API_URL` debe apuntar al backend publico, no a `localhost`.
- En Google Cloud Console, agregar como Authorized redirect URI:

```text
https://TU-FRONTEND.vercel.app/api/auth/callback/google
```

## 4. Prueba final

1. Abrir `https://TU-BACKEND.example.com/docs`.
2. Confirmar que aparecen rutas como `/api/customers/`, `/api/orders`, `/api/billing/`.
3. Abrir el frontend en Vercel.
4. Iniciar sesion.
5. Crear o listar una orden.
6. Abrir el modo mecanico desde una orden.
