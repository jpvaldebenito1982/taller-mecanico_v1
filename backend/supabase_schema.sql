-- Taller mecanico - schema inicial para Supabase/PostgreSQL
-- Ejecutar en Supabase: SQL Editor > New query > Run.
-- El script es idempotente: no elimina tablas ni datos existentes.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS "Taller_mecanico";

CREATE TABLE IF NOT EXISTS "Taller_mecanico".users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    hashed_password VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(50) NOT NULL DEFAULT 'mechanic',
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    document_id VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    plate VARCHAR(20) NOT NULL,
    brand VARCHAR(80),
    model VARCHAR(80),
    year INTEGER,
    color VARCHAR(40),
    mileage_km INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT vehicles_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES "Taller_mecanico".customers(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID,
    vehicle_id UUID,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(30),
    customer_email VARCHAR(150),
    vehicle_text VARCHAR(150),
    plate VARCHAR(20),
    created_at DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Borrador',
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT quotes_status_check
        CHECK (status IN ('Borrador', 'Enviado', 'Aceptado', 'Rechazado', 'Vencido')),
    CONSTRAINT quotes_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES "Taller_mecanico".customers(id)
        ON DELETE RESTRICT,
    CONSTRAINT quotes_vehicle_id_fkey
        FOREIGN KEY (vehicle_id)
        REFERENCES "Taller_mecanico".vehicles(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    quote_id UUID,
    created_at DATE NOT NULL,
    promised_at DATE,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    total NUMERIC(12, 2),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT orders_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES "Taller_mecanico".customers(id)
        ON DELETE RESTRICT,
    CONSTRAINT orders_vehicle_id_fkey
        FOREIGN KEY (vehicle_id)
        REFERENCES "Taller_mecanico".vehicles(id)
        ON DELETE RESTRICT,
    CONSTRAINT orders_quote_id_fkey
        FOREIGN KEY (quote_id)
        REFERENCES "Taller_mecanico".quotes(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(100),
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    supplier VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".order_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    content_type VARCHAR(100),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT order_images_order_id_fkey
        FOREIGN KEY (order_id)
        REFERENCES "Taller_mecanico".orders(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".order_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT order_parts_order_id_fkey
        FOREIGN KEY (order_id)
        REFERENCES "Taller_mecanico".orders(id)
        ON DELETE CASCADE,
    CONSTRAINT order_parts_inventory_item_id_fkey
        FOREIGN KEY (inventory_item_id)
        REFERENCES "Taller_mecanico".inventory_items(id)
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(30),
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT inventory_movements_inventory_item_id_fkey
        FOREIGN KEY (inventory_item_id)
        REFERENCES "Taller_mecanico".inventory_items(id),
    CONSTRAINT inventory_movements_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES "Taller_mecanico".users(id)
);

CREATE TABLE IF NOT EXISTS "Taller_mecanico".billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    document_type VARCHAR(20) NOT NULL DEFAULT 'Boleta',
    customer_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_rut VARCHAR(20),
    customer_giro VARCHAR(255),
    customer_address VARCHAR(255),
    customer_comuna VARCHAR(100),
    customer_city VARCHAR(100),
    order_id UUID,
    order_code VARCHAR(20),
    exento NUMERIC(12, 2) NOT NULL DEFAULT 0,
    neto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    iva NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    libredte_status VARCHAR(50),
    libredte_message TEXT,
    libredte_document_type_code INTEGER,
    libredte_folio INTEGER,
    libredte_codigo_generacion VARCHAR(128),
    libredte_pdf_path VARCHAR(500),
    libredte_xml_path VARCHAR(500),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT billing_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES "Taller_mecanico".customers(id)
        ON DELETE RESTRICT,
    CONSTRAINT billing_order_id_fkey
        FOREIGN KEY (order_id)
        REFERENCES "Taller_mecanico".orders(id)
        ON DELETE SET NULL
);

-- Índices declarados por los modelos SQLAlchemy.
CREATE INDEX IF NOT EXISTS ix_users_email
    ON "Taller_mecanico".users(email);
CREATE INDEX IF NOT EXISTS ix_vehicles_customer_id
    ON "Taller_mecanico".vehicles(customer_id);
CREATE INDEX IF NOT EXISTS ix_vehicles_plate
    ON "Taller_mecanico".vehicles(plate);
CREATE INDEX IF NOT EXISTS ix_orders_code
    ON "Taller_mecanico".orders(code);
CREATE INDEX IF NOT EXISTS ix_orders_customer_id
    ON "Taller_mecanico".orders(customer_id);
CREATE INDEX IF NOT EXISTS ix_orders_vehicle_id
    ON "Taller_mecanico".orders(vehicle_id);
CREATE INDEX IF NOT EXISTS ix_orders_quote_id
    ON "Taller_mecanico".orders(quote_id);
CREATE INDEX IF NOT EXISTS ix_orders_created_at
    ON "Taller_mecanico".orders(created_at);
CREATE INDEX IF NOT EXISTS ix_orders_status
    ON "Taller_mecanico".orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_priority
    ON "Taller_mecanico".orders(priority);
CREATE INDEX IF NOT EXISTS ix_inventory_items_code
    ON "Taller_mecanico".inventory_items(code);
CREATE INDEX IF NOT EXISTS ix_inventory_items_barcode
    ON "Taller_mecanico".inventory_items(barcode);
CREATE INDEX IF NOT EXISTS ix_inventory_items_name
    ON "Taller_mecanico".inventory_items(name);
CREATE INDEX IF NOT EXISTS ix_inventory_items_category
    ON "Taller_mecanico".inventory_items(category);
CREATE INDEX IF NOT EXISTS ix_order_parts_order_id
    ON "Taller_mecanico".order_parts(order_id);
CREATE INDEX IF NOT EXISTS ix_order_parts_inventory_item_id
    ON "Taller_mecanico".order_parts(inventory_item_id);
CREATE INDEX IF NOT EXISTS ix_inventory_movements_inventory_item_id
    ON "Taller_mecanico".inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS ix_inventory_movements_created_by
    ON "Taller_mecanico".inventory_movements(created_by);

COMMIT;

-- Verificación opcional: debe devolver 10 filas.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'Taller_mecanico'
ORDER BY table_name;
