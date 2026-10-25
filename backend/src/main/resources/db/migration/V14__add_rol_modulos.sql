CREATE TABLE rol_modulos (
    rol_id BIGINT NOT NULL,
    modulo VARCHAR(255) NOT NULL,
    FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE CASCADE
);