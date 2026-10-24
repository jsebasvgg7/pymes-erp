CREATE TABLE apertura_caja (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    caja_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    usuario_apertura_id BIGINT NOT NULL,
    fecha_apertura TIMESTAMP(6) NOT NULL,
    efectivo_inicial DECIMAL(19,2) NOT NULL DEFAULT 0,
    usuario_cierre_id BIGINT,
    fecha_cierre TIMESTAMP(6),
    efectivo_esperado DECIMAL(19,2),
    efectivo_contado DECIMAL(19,2),
    diferencia DECIMAL(19,2),
    tipo_cierre VARCHAR(20),
    CONSTRAINT fk_apertura_caja_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_apertura_caja_caja FOREIGN KEY (caja_id) REFERENCES caja(id),
    CONSTRAINT fk_apertura_caja_usuario_apertura FOREIGN KEY (usuario_apertura_id) REFERENCES usuario(id),
    CONSTRAINT fk_apertura_caja_usuario_cierre FOREIGN KEY (usuario_cierre_id) REFERENCES usuario(id),
    CONSTRAINT ck_apertura_caja_estado CHECK (estado IN ('ABIERTA', 'CERRADA')),
    CONSTRAINT ck_apertura_caja_tipo_cierre CHECK (tipo_cierre IS NULL OR tipo_cierre IN ('MANUAL', 'AUTOMATICO')),
    CONSTRAINT ck_apertura_caja_efectivo_inicial CHECK (efectivo_inicial >= 0)
);

CREATE UNIQUE INDEX uq_apertura_caja_abierta ON apertura_caja(caja_id) WHERE estado = 'ABIERTA';
CREATE INDEX idx_apertura_caja_empresa_fecha ON apertura_caja(empresa_id, fecha_apertura);
CREATE INDEX idx_apertura_caja_caja_estado ON apertura_caja(caja_id, estado);

ALTER TABLE movimiento_caja ADD COLUMN apertura_id BIGINT;
ALTER TABLE movimiento_caja
    ADD CONSTRAINT fk_movimiento_caja_apertura FOREIGN KEY (apertura_id) REFERENCES apertura_caja(id);
CREATE INDEX idx_movimiento_caja_apertura_id ON movimiento_caja(apertura_id);
