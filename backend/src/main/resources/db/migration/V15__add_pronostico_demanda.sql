CREATE TABLE pronostico_demanda (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    semana_pronosticada DATE NOT NULL,
    unidades_proyectadas DECIMAL(10, 2) NOT NULL,
    version_modelo VARCHAR(50) NOT NULL,
    fecha_calculo TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pronostico_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
    CONSTRAINT fk_pronostico_producto FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE
);