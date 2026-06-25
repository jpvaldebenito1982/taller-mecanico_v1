ALTER TABLE "Taller_mecanico".billing
    ADD COLUMN IF NOT EXISTS libredte_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS libredte_message TEXT,
    ADD COLUMN IF NOT EXISTS libredte_document_type_code INTEGER,
    ADD COLUMN IF NOT EXISTS libredte_folio INTEGER,
    ADD COLUMN IF NOT EXISTS libredte_codigo_generacion VARCHAR(128),
    ADD COLUMN IF NOT EXISTS libredte_pdf_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS libredte_xml_path VARCHAR(500);
