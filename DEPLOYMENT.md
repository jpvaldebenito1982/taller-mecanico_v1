# Despliegue de pruebas sin Railway

La combinación recomendada para este repositorio es:

- Supabase: PostgreSQL.
- Render: backend FastAPI.
- Vercel: frontend Next.js.

No subas los archivos `.env` a GitHub. Los secretos se ingresan en los paneles de cada plataforma.

## 1. Crear PostgreSQL en Supabase

1. Crea un proyecto en Supabase.
2. Abre **Connect** y copia la cadena de conexión del **Session pooler**. Es preferible para evitar problemas de conectividad IPv4 desde el hosting.
3. Cambia el marcador de contraseña por la contraseña real del proyecto.
4. Usa la cadena completa como `DATABASE_URL` en Render. La aplicación acepta tanto `postgresql://` como `postgresql+psycopg://`.

No es necesario crear tablas a mano. El backend ejecuta `python -m app.db.init_db` al arrancar y crea el schema `Taller_mecanico` y las tablas que falten.

## 2. Publicar FastAPI en Render

1. Confirma que los cambios estén subidos al repositorio de GitHub.
2. En Render selecciona **New > Blueprint**.
3. Conecta el repositorio. Render detectará el archivo `render.yaml` de la raíz.
4. Completa las variables solicitadas:

   ```env
   DATABASE_URL=postgresql://...cadena-de-supabase...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   FRONTEND_URL=https://TU-FRONTEND.vercel.app
   BACKEND_URL=https://taller-mecanico-api.onrender.com
   CORS_ORIGINS=https://TU-FRONTEND.vercel.app,http://localhost:3001
   ```

5. Crea el servicio y espera el primer despliegue.
6. Si Render asigna un dominio distinto, actualiza `BACKEND_URL` con el dominio real.

Comprueba estas direcciones:

```text
https://TU-BACKEND.onrender.com/health
https://TU-BACKEND.onrender.com/docs
```

En el plan gratuito, la primera solicitud después de un período sin tráfico puede tardar mientras el servicio vuelve a arrancar.

## 3. Publicar Next.js en Vercel

1. En Vercel importa el mismo repositorio.
2. Selecciona **Next.js** y establece **Root Directory** en `frontend`.
3. Agrega estas variables para Production y Preview:

   ```env
   NEXT_PUBLIC_API_URL=https://TU-BACKEND.onrender.com
   NEXTAUTH_URL=https://TU-FRONTEND.vercel.app
   NEXTAUTH_SECRET=una-clave-aleatoria-larga
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

4. Despliega y copia el dominio generado.
5. Regresa a Render y corrige `FRONTEND_URL` y `CORS_ORIGINS` con el dominio exacto de Vercel.

Para generar `NEXTAUTH_SECRET` localmente:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 4. Configurar Google OAuth

En Google Cloud Console agrega al cliente OAuth:

```text
Authorized JavaScript origin:
https://TU-FRONTEND.vercel.app

Authorized redirect URI:
https://TU-FRONTEND.vercel.app/api/auth/callback/google
```

Conserva las direcciones de localhost si continuarás desarrollando localmente.

## 5. Prueba final

1. Abre `/health` y `/docs` en Render.
2. Abre Vercel e inicia sesión con Google.
3. Lista clientes y vehículos.
4. Crea una orden y comprueba que aparece en el listado.

## Límites importantes

- `init_db` es apropiado para el primer despliegue y cambios que solamente agreguen tablas. Los cambios futuros de columnas deberían hacerse con migraciones Alembic.
- `backend/uploads` vive en el disco temporal del servidor. Las imágenes pueden desaparecer en un redespliegue; para producción deben guardarse en Supabase Storage u otro almacenamiento persistente.
- El login de NextAuth protege la interfaz, pero la API aún no exige autenticación en sus endpoints de negocio. No manejes información real hasta agregar autorización en FastAPI.
