-- =============================================
-- V2__add_impuestos_y_cuentas.sql
-- Impuestos, Cuentas por cobrar/pagar y relaciones
-- =============================================

-- 1. TABLA: impuesto
CREATE TABLE IF NOT EXISTS impuesto (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    tasa DECIMAL(10,4) NOT NULL,
    tipo_impuesto VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_impuesto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT uk_impuesto_empresa_codigo UNIQUE(empresa_id, codigo)
);
CREATE INDEX idx_impuesto_empresa ON impuesto(empresa_id);
CREATE INDEX idx_impuesto_active ON impuesto(active);

-- 2. TABLA: producto_impuesto (N:N)
CREATE TABLE IF NOT EXISTS producto_impuesto (
    producto_id BIGINT NOT NULL,
    impuesto_id BIGINT NOT NULL,
    PRIMARY KEY (producto_id, impuesto_id),
    CONSTRAINT fk_producto_impuesto_producto FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT fk_producto_impuesto_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto(id)
);
CREATE INDEX idx_producto_impuesto_producto ON producto_impuesto(producto_id);
CREATE INDEX idx_producto_impuesto_impuesto ON producto_impuesto(impuesto_id);

-- 3. TABLA: detalle_factura_impuesto (N:N)
CREATE TABLE IF NOT EXISTS detalle_factura_impuesto (
    detalle_factura_id BIGINT NOT NULL,
    impuesto_id BIGINT NOT NULL,
    PRIMARY KEY (detalle_factura_id, impuesto_id),
    CONSTRAINT fk_detalle_factura_impuesto_detalle FOREIGN KEY (detalle_factura_id) REFERENCES detalle_factura(id),
    CONSTRAINT fk_detalle_factura_impuesto_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto(id)
);
CREATE INDEX idx_detalle_factura_impuesto_detalle ON detalle_factura_impuesto(detalle_factura_id);
CREATE INDEX idx_detalle_factura_impuesto_impuesto ON detalle_factura_impuesto(impuesto_id);

-- 4. TABLA: detalle_compra_impuesto (N:N)
CREATE TABLE IF NOT EXISTS detalle_compra_impuesto (
    detalle_compra_id BIGINT NOT NULL,
    impuesto_id BIGINT NOT NULL,
    PRIMARY KEY (detalle_compra_id, impuesto_id),
    CONSTRAINT fk_detalle_compra_impuesto_detalle FOREIGN KEY (detalle_compra_id) REFERENCES detalle_compra(id),
    CONSTRAINT fk_detalle_compra_impuesto_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto(id)
);
CREATE INDEX idx_detalle_compra_impuesto_detalle ON detalle_compra_impuesto(detalle_compra_id);
CREATE INDEX idx_detalle_compra_impuesto_impuesto ON detalle_compra_impuesto(impuesto_id);

-- 5. TABLA: cuenta_por_cobrar
CREATE TABLE IF NOT EXISTS cuenta_por_cobrar (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    factura_venta_id BIGINT UNIQUE,
    cliente_id BIGINT NOT NULL,
    monto_original DECIMAL(19,2) NOT NULL,
    saldo DECIMAL(19,2) NOT NULL,
    fecha_vencimiento TIMESTAMP(6),
    estado VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuenta_cobrar_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_cuenta_cobrar_factura FOREIGN KEY (factura_venta_id) REFERENCES factura_venta(id),
    CONSTRAINT fk_cuenta_cobrar_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT chk_cuenta_cobrar_saldo CHECK (saldo >= 0)
);
CREATE INDEX idx_cuenta_cobrar_empresa ON cuenta_por_cobrar(empresa_id);
CREATE INDEX idx_cuenta_cobrar_cliente ON cuenta_por_cobrar(cliente_id);
CREATE INDEX idx_cuenta_cobrar_estado ON cuenta_por_cobrar(estado);
CREATE INDEX idx_cuenta_cobrar_fecha_vencimiento ON cuenta_por_cobrar(fecha_vencimiento);

-- 6. TABLA: cuenta_por_pagar
CREATE TABLE IF NOT EXISTS cuenta_por_pagar (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    compra_id BIGINT UNIQUE,
    proveedor_id BIGINT NOT NULL,
    monto_original DECIMAL(19,2) NOT NULL,
    saldo DECIMAL(19,2) NOT NULL,
    fecha_vencimiento TIMESTAMP(6),
    estado VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuenta_pagar_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_cuenta_pagar_compra FOREIGN KEY (compra_id) REFERENCES compra(id),
    CONSTRAINT fk_cuenta_pagar_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedor(id),
    CONSTRAINT chk_cuenta_pagar_saldo CHECK (saldo >= 0)
);
CREATE INDEX idx_cuenta_pagar_empresa ON cuenta_por_pagar(empresa_id);
CREATE INDEX idx_cuenta_pagar_proveedor ON cuenta_por_pagar(proveedor_id);
CREATE INDEX idx_cuenta_pagar_estado ON cuenta_por_pagar(estado);
CREATE INDEX idx_cuenta_pagar_fecha_vencimiento ON cuenta_por_pagar(fecha_vencimiento);

-- =============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================
COMMENT ON TABLE impuesto IS 'Catálogo de impuestos (IVA, retefuente, etc.)';
COMMENT ON TABLE producto_impuesto IS 'Relación N:N entre productos e impuestos';
COMMENT ON TABLE detalle_factura_impuesto IS 'Impuestos aplicados a cada detalle de factura';
COMMENT ON TABLE detalle_compra_impuesto IS 'Impuestos aplicados a cada detalle de compra';
COMMENT ON TABLE cuenta_por_cobrar IS 'Cuentas por cobrar derivadas de facturas de venta';
COMMENT ON TABLE cuenta_por_pagar IS 'Cuentas por pagar derivadas de compras';