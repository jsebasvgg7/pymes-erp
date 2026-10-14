INSERT INTO forma_pago (created_at, updated_at, active, nombre, tipo, empresa_id)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, 'Crédito', 'CREDITO', id
FROM empresa;
