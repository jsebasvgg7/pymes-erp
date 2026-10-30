CREATE TABLE codigo_registro (
    id BIGSERIAL PRIMARY KEY,
    codigo_hash VARCHAR(64) NOT NULL,
    nota VARCHAR(200),
    expira_en TIMESTAMP(6) NOT NULL,
    usado_en TIMESTAMP(6),
    empresa_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_codigo_registro_hash UNIQUE (codigo_hash),
    CONSTRAINT ck_codigo_registro_hash CHECK (codigo_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT fk_codigo_registro_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE SET NULL
);
