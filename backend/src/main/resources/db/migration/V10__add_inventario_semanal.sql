-- =============================================
-- V10__add_inventario_semanal.sql
-- Foto semanal del stock por producto (US-04 / AC4)
-- =============================================

CREATE TABLE inventario_semanal (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    semana_inicio DATE NOT NULL,            -- lunes de la semana
    cantidad DECIMAL(19,3) NOT NULL,        -- stock al momento de la foto
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_sem_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_inv_sem_producto FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT uq_inv_sem_producto_semana UNIQUE (producto_id, semana_inicio)
);

CREATE INDEX idx_inv_sem_empresa_semana ON inventario_semanal(empresa_id, semana_inicio);

COMMENT ON TABLE inventario_semanal IS 'Una fila por producto y semana con el stock registrado';