ALTER TABLE configuracion_empresa
    DROP CONSTRAINT ck_configuracion_dias_credito;

ALTER TABLE configuracion_empresa
    ALTER COLUMN dias_vencimiento_credito DROP NOT NULL;

ALTER TABLE configuracion_empresa
    ALTER COLUMN dias_vencimiento_credito DROP DEFAULT;

UPDATE configuracion_empresa
SET dias_vencimiento_credito = NULL;

ALTER TABLE configuracion_empresa
    ADD CONSTRAINT ck_configuracion_dias_credito
    CHECK (dias_vencimiento_credito IS NULL OR dias_vencimiento_credito BETWEEN 1 AND 365);
