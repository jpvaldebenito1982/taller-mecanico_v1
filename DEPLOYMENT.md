# Despliegue de pruebas: Railway + Vercel

La alternativa más simple para este repositorio es:

- Railway: backend FastAPI y PostgreSQL.
- Vercel: frontend Next.js.

Los dos servicios pueden desplegarse desde el repositorio de GitHub. No subas los archivos `.env`; carga sus valores en los paneles de cada plataforma.

## 1. Publicar el backend y PostgreSQL en Railway

1. En Railway, crea un proyecto con **Deploy from GitHub repo** y selecciona este repositorio.
2. En la configuración del servicio del backend establece **Root Directory** en `/backend`.
3. Agrega un servicio PostgreSQL al mismo proyecto con **New > Database > PostgreSQL**.
4. En las variables del backend agrega una referencia a la variable de PostgreSQL:

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

   Si el servicio de base de datos tiene otro nombre, reemplaza `Postgres` por ese nombre.

5. Carga también estas variables:

   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   JWT_SECRET_KEY=una-clave-aleatoria-larga
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
   FRONTEND_URL=https://TU-FRONTEND.vercel.app
   BACKEND_URL=https://TU-BACKEND.up.railway.app
   CORS_ORIGINS=https://TU-FRONTEND.vercel.app,http://localhost:3001
   ```

6. Las variables `LIBREDTE_*` de `backend/.env.example` son opcionales para las pruebas que no emitan documentos tributarios.
7. En **Settings > Networking**, genera un dominio público.

Railway leerá `backend/railway.json`. Antes de iniciar la API ejecutará `python -m app.db.init_db`, que crea el schema `Taller_mecanico` y sus tablas si aún no existen. Después iniciará Uvicorn y comprobará `/health`.

Comprueba:

```text
https://TU-BACKEND.up.railway.app/health
https://TU-BACKEND.up.railway.app/docs
```

## 2. Publicar el frontend en Vercel

1. En Vercel, crea un proyecto e importa el mismo repositorio.
2. Selecciona **Next.js** y establece **Root Directory** en `frontend`.
3. Agrega estas variables en Production y Preview:

   ```env
   NEXT_PUBLIC_API_URL=https://TU-BACKEND.up.railway.app
   NEXTAUTH_URL=https://TU-FRONTEND.vercel.app
   NEXTAUTH_SECRET=una-clave-aleatoria-larga-y-distinta
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

4. Despliega y copia el dominio generado.
5. Vuelve a Railway y actualiza `FRONTEND_URL` y `CORS_ORIGINS` con ese dominio exacto. Railway volverá a desplegar el backend.

Puedes generar los secretos localmente con:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 3. Configurar Google OAuth

En Google Cloud Console, en el cliente OAuth usado por NextAuth, agrega:

```text
Authorized JavaScript origin:
https://TU-FRONTEND.vercel.app

Authorized redirect URI:
https://TU-FRONTEND.vercel.app/api/auth/callback/google
```

Conserva también las URLs de localhost si seguirás desarrollando localmente.

## 4. Prueba final

1. Abre `/health` y `/docs` en Railway.
2. Abre el frontend en Vercel e inicia sesión con Google.
3. Lista clientes y vehículos.
4. Crea una orden y confirma que aparece en el listado.

## Consideraciones para producción

- `app.db.init_db` sirve para el primer despliegue y cambios aditivos. Antes de evolucionar tablas existentes conviene incorporar migraciones Alembic.
- Railway usa almacenamiento efímero para `backend/uploads`. Las imágenes pueden perderse en un redespliegue; para producción deben moverse a almacenamiento de objetos o montarse en un volumen persistente.
- La API actual no protege sus endpoints de negocio con autenticación. El login del frontend no impide que alguien invoque directamente la URL pública del backend; agrega autorización al backend antes de manejar información real.
