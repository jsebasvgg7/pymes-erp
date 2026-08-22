-- =============================================
-- V1__initial_erp_schema.sql
-- Esquema inicial del ERP para PostgreSQL
-- =============================================

CREATE TABLE empresa (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    nombre VARCHAR(200) NOT NULL,
    nit VARCHAR(50),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(150)
);

CREATE TABLE rol (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255),
    CONSTRAINT fk_rol_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_rol_empresa_id ON rol(empresa_id);

CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT uq_usuario_email UNIQUE(email),
    CONSTRAINT uq_usuario_empresa_username UNIQUE(empresa_id, username)
);

CREATE TABLE usuario_rol (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
);
CREATE INDEX idx_usuario_rol_rol_id ON usuario_rol(rol_id);

CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    documento VARCHAR(60),
    telefono VARCHAR(50),
    email VARCHAR(150),
    direccion VARCHAR(255),
    CONSTRAINT fk_cliente_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_cliente_empresa_id ON cliente(empresa_id);

CREATE TABLE proveedor (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    documento VARCHAR(60),
    telefono VARCHAR(50),
    email VARCHAR(150),
    direccion VARCHAR(255),
    CONSTRAINT fk_proveedor_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_proveedor_empresa_id ON proveedor(empresa_id);

CREATE TABLE categoria_producto (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    CONSTRAINT fk_categoria_producto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_categoria_producto_empresa_id ON categoria_producto(empresa_id);

CREATE TABLE producto (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    categoria_id BIGINT,
    sku VARCHAR(60),
    nombre VARCHAR(200) NOT NULL,
    descripcion VARCHAR(500),
    unidad_medida VARCHAR(30) NOT NULL,
    precio_venta DECIMAL(19,2) NOT NULL,
    costo DECIMAL(19,2) NOT NULL,
    stock_minimo DECIMAL(19,3) NOT NULL,
    CONSTRAINT fk_producto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_producto(id)
);
CREATE INDEX idx_producto_empresa_id ON producto(empresa_id);
CREATE INDEX idx_producto_categoria_id ON producto(categoria_id);

CREATE TABLE inventario (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad_actual DECIMAL(19,3) NOT NULL,
    costo_promedio DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_inventario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_inventario_producto FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT uq_inventario_producto_id UNIQUE(producto_id)
);
CREATE INDEX idx_inventario_empresa_id ON inventario(empresa_id);

CREATE TABLE forma_pago (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    CONSTRAINT fk_forma_pago_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_forma_pago_empresa_id ON forma_pago(empresa_id);

CREATE TABLE caja (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    saldo_inicial DECIMAL(19,2) NOT NULL,
    saldo_actual DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_caja_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);
CREATE INDEX idx_caja_empresa_id ON caja(empresa_id);

CREATE TABLE movimiento_caja (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    caja_id BIGINT NOT NULL,
    forma_pago_id BIGINT,
    fecha TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) NOT NULL,
    monto DECIMAL(19,2) NOT NULL,
    descripcion VARCHAR(255),
    tipo_referencia VARCHAR(30) NOT NULL,
    referencia_id BIGINT,
    CONSTRAINT fk_movimiento_caja_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_movimiento_caja_caja FOREIGN KEY (caja_id) REFERENCES caja(id),
    CONSTRAINT fk_movimiento_caja_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago(id)
);
CREATE INDEX idx_movimiento_caja_empresa_id ON movimiento_caja(empresa_id);
CREATE INDEX idx_movimiento_caja_caja_id ON movimiento_caja(caja_id);
CREATE INDEX idx_movimiento_caja_forma_pago_id ON movimiento_caja(forma_pago_id);

CREATE TABLE factura_venta (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    cliente_id BIGINT NOT NULL,
    forma_pago_id BIGINT,
    numero VARCHAR(40) NOT NULL,
    fecha_emision TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP(6),
    estado VARCHAR(30) NOT NULL,
    subtotal DECIMAL(19,2) NOT NULL,
    total_impuestos DECIMAL(19,2) NOT NULL DEFAULT 0,
    total DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_factura_venta_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_factura_venta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_factura_venta_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago(id)
);
CREATE INDEX idx_factura_venta_empresa_id ON factura_venta(empresa_id);
CREATE INDEX idx_factura_venta_cliente_id ON factura_venta(cliente_id);
CREATE INDEX idx_factura_venta_forma_pago_id ON factura_venta(forma_pago_id);

CREATE TABLE detalle_factura (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    factura_venta_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(19,3) NOT NULL,
    precio_unitario DECIMAL(19,2) NOT NULL,
    total_linea DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_detalle_factura_factura_venta FOREIGN KEY (factura_venta_id) REFERENCES factura_venta(id),
    CONSTRAINT fk_detalle_factura_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
);
CREATE INDEX idx_detalle_factura_factura_venta_id ON detalle_factura(factura_venta_id);
CREATE INDEX idx_detalle_factura_producto_id ON detalle_factura(producto_id);

CREATE TABLE compra (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    empresa_id BIGINT NOT NULL,
    proveedor_id BIGINT NOT NULL,
    forma_pago_id BIGINT,
    numero_documento VARCHAR(60) NOT NULL,
    fecha_compra TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP(6),
    estado VARCHAR(30) NOT NULL,
    subtotal DECIMAL(19,2) NOT NULL,
    total_impuestos DECIMAL(19,2) NOT NULL DEFAULT 0,
    total DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_compra_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_compra_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedor(id),
    CONSTRAINT fk_compra_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago(id)
);
CREATE INDEX idx_compra_empresa_id ON compra(empresa_id);
CREATE INDEX idx_compra_proveedor_id ON compra(proveedor_id);
CREATE INDEX idx_compra_forma_pago_id ON compra(forma_pago_id);

CREATE TABLE detalle_compra (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    compra_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(19,3) NOT NULL,
    costo_unitario DECIMAL(19,2) NOT NULL,
    total_linea DECIMAL(19,2) NOT NULL,
    CONSTRAINT fk_detalle_compra_compra FOREIGN KEY (compra_id) REFERENCES compra(id),
    CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
);
CREATE INDEX idx_detalle_compra_compra_id ON detalle_compra(compra_id);
CREATE INDEX idx_detalle_compra_producto_id ON detalle_compra(producto_id);