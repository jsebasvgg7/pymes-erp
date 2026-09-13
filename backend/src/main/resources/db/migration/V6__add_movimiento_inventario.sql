-- =============================================
-- V6__add_movimiento_inventario.sql
-- Tabla para auditar ajustes manuales de stock
-- =============================================

CREATE TABLE movimiento_inventario (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT,
    tipo VARCHAR(20) NOT NULL,           -- ENTRADA | SALIDA | CONTEO
    cantidad_anterior DECIMAL(19,3) NOT NULL,
    cantidad_nueva DECIMAL(19,3) NOT NULL,
    diferencia DECIMAL(19,3) NOT NULL,   -- cantidad_nueva - cantidad_anterior
    motivo VARCHAR(120) NOT NULL,
    notas VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_inv_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_mov_inv_producto FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT fk_mov_inv_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX idx_mov_inv_empresa ON movimiento_inventario(empresa_id);
CREATE INDEX idx_mov_inv_producto ON movimiento_inventario(producto_id);
CREATE INDEX idx_mov_inv_usuario ON movimiento_inventario(usuario_id);
CREATE INDEX idx_mov_inv_fecha ON movimiento_inventario(created_at);

COMMENT ON TABLE movimiento_inventario IS 'Historial de ajustes manuales de stock (auditoría)';
COMMENT ON COLUMN movimiento_inventario.tipo IS 'ENTRADA: suma stock | SALIDA: resta stock | CONTEO: fija stock a un valor exacto';
COMMENT ON COLUMN movimiento_inventario.diferencia IS 'cantidad_nueva - cantidad_anterior (positivo = sumó, negativo = restó)';
