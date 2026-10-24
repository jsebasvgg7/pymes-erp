CREATE TABLE configuracion_empresa (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'COP',
    simbolo_moneda VARCHAR(5) NOT NULL DEFAULT '$',
    formato_fecha VARCHAR(20) NOT NULL DEFAULT 'DD/MM/AAAA',
    cliente_obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
    dias_vencimiento_credito INTEGER NOT NULL DEFAULT 30,
    codigo_barras_activo BOOLEAN NOT NULL DEFAULT FALSE,
    stock_minimo_defecto DECIMAL(19,3) NOT NULL DEFAULT 0,
    avisar_stock_bajo BOOLEAN NOT NULL DEFAULT TRUE,
    hora_cierre_automatico TIME NOT NULL DEFAULT '04:00',
    ancho_recibo INTEGER NOT NULL DEFAULT 58,
    nombre_recibo VARCHAR(150),
    mensaje_pie_recibo VARCHAR(255),
    CONSTRAINT fk_configuracion_empresa_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT uq_configuracion_empresa_empresa UNIQUE (empresa_id),
    CONSTRAINT ck_configuracion_formato_fecha CHECK (formato_fecha IN ('DD/MM/AAAA', 'MM/DD/AAAA', 'AAAA-MM-DD')),
    CONSTRAINT ck_configuracion_dias_credito CHECK (dias_vencimiento_credito BETWEEN 1 AND 365),
    CONSTRAINT ck_configuracion_stock_minimo CHECK (stock_minimo_defecto >= 0),
    CONSTRAINT ck_configuracion_ancho_recibo CHECK (ancho_recibo IN (58, 80))
);

INSERT INTO configuracion_empresa (empresa_id)
SELECT id FROM empresa;
