-- Usuarios iniciales para Taller_mecanico
--
-- 1. Reemplaza los datos de ejemplo por los usuarios reales.
-- 2. Quita el comentario /* ... */ que rodea al INSERT.
-- 3. Ejecuta el archivo en Supabase > SQL Editor.
--
-- Roles admitidos por la aplicación: admin, mechanic, advisor.
-- El acceso usa Google/NextAuth; hashed_password puede permanecer en NULL.

    BEGIN;

    /*
    INSERT INTO "Taller_mecanico".users (
        email,
        full_name,
        phone,
        role,
        is_active,
        hashed_password
    )
    VALUES
        ('administrador@ejemplo.cl', 'Administrador', '+56 9 1111 1111', 'admin', TRUE, NULL),
        ('mecanico@ejemplo.cl', 'Mecánico Principal', '+56 9 2222 2222', 'mechanic', TRUE, NULL),
        ('asesor@ejemplo.cl', 'Asesor de Servicio', '+56 9 3333 3333', 'advisor', TRUE, NULL)
    ON CONFLICT (email) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    */

    COMMIT;

    -- Verificación: nunca muestra hashed_password.
    SELECT
        id,
        email,
        full_name,
        phone,
        role,
        is_active,
        created_at,
        updated_at
    FROM "Taller_mecanico".users
    ORDER BY full_name, email;
