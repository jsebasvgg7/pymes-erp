-- =============================================
-- V4__rename_tasa_to_porcentaje.sql
-- Renombrar columna tasa a porcentaje para coincidir con JPA
-- =============================================

ALTER TABLE impuesto RENAME COLUMN tasa TO porcentaje;

-- También actualizar el comentario
COMMENT ON COLUMN impuesto.porcentaje IS 'Porcentaje del impuesto (ej: 19.00 para IVA)';