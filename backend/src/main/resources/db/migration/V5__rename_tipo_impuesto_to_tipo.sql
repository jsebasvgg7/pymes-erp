-- =============================================
-- V5__rename_tipo_impuesto_to_tipo.sql
-- Renombrar columna tipo_impuesto a tipo para coincidir con JPA
-- =============================================

ALTER TABLE impuesto RENAME COLUMN tipo_impuesto TO tipo;

-- Actualizar comentario
COMMENT ON COLUMN impuesto.tipo IS 'Tipo de impuesto: IVA, RETENCION, OTRO';