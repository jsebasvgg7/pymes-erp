-- US-11: la forma de pago pasa a ser obligatoria al registrar una Compra.
-- Backfill seguro para compras existentes sin forma_pago_id: se asigna la
-- forma de pago activa de la MISMA empresa (prioriza "Efectivo" si existe,
-- si no la primera activa por id). No se usa un valor global porque
-- forma_pago es una tabla multiempresa.

UPDATE compra c
SET forma_pago_id = fp.id
FROM (
    SELECT DISTINCT ON (empresa_id) empresa_id, id
    FROM forma_pago
    WHERE active = TRUE
    ORDER BY empresa_id, (nombre ILIKE 'Efectivo') DESC, id ASC
) fp
WHERE c.forma_pago_id IS NULL
  AND c.empresa_id = fp.empresa_id;

ALTER TABLE compra
    ALTER COLUMN forma_pago_id SET NOT NULL;
