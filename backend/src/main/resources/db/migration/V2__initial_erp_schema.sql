CREATE TABLE empresa (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	nombre VARCHAR(200) NOT NULL,
	nit VARCHAR(50),
	direccion VARCHAR(255),
	telefono VARCHAR(50),
	email VARCHAR(150),
	PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE rol (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(80) NOT NULL,
	descripcion VARCHAR(255),
	PRIMARY KEY (id),
	INDEX idx_rol_empresa_id (empresa_id),
	CONSTRAINT fk_rol_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE usuario (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	username VARCHAR(80) NOT NULL,
	email VARCHAR(150) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_usuario_email (email),
	UNIQUE KEY uq_usuario_empresa_username (empresa_id, username),
	CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE usuario_rol (
	usuario_id BIGINT NOT NULL,
	rol_id BIGINT NOT NULL,
	PRIMARY KEY (usuario_id, rol_id),
	INDEX idx_usuario_rol_rol_id (rol_id),
	CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
	CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (rol_id) REFERENCES rol (id)
) ENGINE=InnoDB;

CREATE TABLE cliente (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(200) NOT NULL,
	documento VARCHAR(60),
	telefono VARCHAR(50),
	email VARCHAR(150),
	direccion VARCHAR(255),
	PRIMARY KEY (id),
	INDEX idx_cliente_empresa_id (empresa_id),
	CONSTRAINT fk_cliente_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE proveedor (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(200) NOT NULL,
	documento VARCHAR(60),
	telefono VARCHAR(50),
	email VARCHAR(150),
	direccion VARCHAR(255),
	PRIMARY KEY (id),
	INDEX idx_proveedor_empresa_id (empresa_id),
	CONSTRAINT fk_proveedor_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE categoria_producto (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(120) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_categoria_producto_empresa_id (empresa_id),
	CONSTRAINT fk_categoria_producto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE producto (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	categoria_id BIGINT,
	sku VARCHAR(60),
	nombre VARCHAR(200) NOT NULL,
	descripcion VARCHAR(500),
	unidad_medida VARCHAR(30) NOT NULL,
	precio_venta DECIMAL(19, 2) NOT NULL,
	costo DECIMAL(19, 2) NOT NULL,
	stock_minimo DECIMAL(19, 3) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_producto_empresa_id (empresa_id),
	INDEX idx_producto_categoria_id (categoria_id),
	CONSTRAINT fk_producto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
	CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_producto (id)
) ENGINE=InnoDB;

CREATE TABLE inventario (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	producto_id BIGINT NOT NULL,
	cantidad_actual DECIMAL(19, 3) NOT NULL,
	costo_promedio DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_inventario_producto_id (producto_id),
	INDEX idx_inventario_empresa_id (empresa_id),
	CONSTRAINT fk_inventario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
	CONSTRAINT fk_inventario_producto FOREIGN KEY (producto_id) REFERENCES producto (id)
) ENGINE=InnoDB;

CREATE TABLE forma_pago (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(120) NOT NULL,
	tipo VARCHAR(30) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_forma_pago_empresa_id (empresa_id),
	CONSTRAINT fk_forma_pago_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE caja (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	nombre VARCHAR(120) NOT NULL,
	saldo_inicial DECIMAL(19, 2) NOT NULL,
	saldo_actual DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_caja_empresa_id (empresa_id),
	CONSTRAINT fk_caja_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id)
) ENGINE=InnoDB;

CREATE TABLE movimiento_caja (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	caja_id BIGINT NOT NULL,
	forma_pago_id BIGINT,
	fecha DATETIME(6) NOT NULL,
	tipo VARCHAR(20) NOT NULL,
	monto DECIMAL(19, 2) NOT NULL,
	descripcion VARCHAR(255),
	tipo_referencia VARCHAR(30) NOT NULL,
	referencia_id BIGINT,
	PRIMARY KEY (id),
	INDEX idx_movimiento_caja_empresa_id (empresa_id),
	INDEX idx_movimiento_caja_caja_id (caja_id),
	INDEX idx_movimiento_caja_forma_pago_id (forma_pago_id),
	CONSTRAINT fk_movimiento_caja_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
	CONSTRAINT fk_movimiento_caja_caja FOREIGN KEY (caja_id) REFERENCES caja (id),
	CONSTRAINT fk_movimiento_caja_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago (id)
) ENGINE=InnoDB;

CREATE TABLE factura_venta (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	cliente_id BIGINT NOT NULL,
	forma_pago_id BIGINT,
	numero VARCHAR(40) NOT NULL,
	fecha_emision DATETIME(6) NOT NULL,
	fecha_vencimiento DATETIME(6),
	estado VARCHAR(30) NOT NULL,
	subtotal DECIMAL(19, 2) NOT NULL,
	total_impuestos DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
	total DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_factura_venta_empresa_id (empresa_id),
	INDEX idx_factura_venta_cliente_id (cliente_id),
	INDEX idx_factura_venta_forma_pago_id (forma_pago_id),
	CONSTRAINT fk_factura_venta_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
	CONSTRAINT fk_factura_venta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
	CONSTRAINT fk_factura_venta_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago (id)
) ENGINE=InnoDB;

CREATE TABLE detalle_factura (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	factura_venta_id BIGINT NOT NULL,
	producto_id BIGINT NOT NULL,
	descripcion VARCHAR(255) NOT NULL,
	cantidad DECIMAL(19, 3) NOT NULL,
	precio_unitario DECIMAL(19, 2) NOT NULL,
	total_linea DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_detalle_factura_factura_venta_id (factura_venta_id),
	INDEX idx_detalle_factura_producto_id (producto_id),
	CONSTRAINT fk_detalle_factura_factura_venta FOREIGN KEY (factura_venta_id) REFERENCES factura_venta (id),
	CONSTRAINT fk_detalle_factura_producto FOREIGN KEY (producto_id) REFERENCES producto (id)
) ENGINE=InnoDB;

CREATE TABLE compra (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	empresa_id BIGINT NOT NULL,
	proveedor_id BIGINT NOT NULL,
	forma_pago_id BIGINT,
	numero_documento VARCHAR(60) NOT NULL,
	fecha_compra DATETIME(6) NOT NULL,
	fecha_vencimiento DATETIME(6),
	estado VARCHAR(30) NOT NULL,
	subtotal DECIMAL(19, 2) NOT NULL,
	total_impuestos DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
	total DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_compra_empresa_id (empresa_id),
	INDEX idx_compra_proveedor_id (proveedor_id),
	INDEX idx_compra_forma_pago_id (forma_pago_id),
	CONSTRAINT fk_compra_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
	CONSTRAINT fk_compra_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedor (id),
	CONSTRAINT fk_compra_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago (id)
) ENGINE=InnoDB;

CREATE TABLE detalle_compra (
	id BIGINT NOT NULL AUTO_INCREMENT,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	compra_id BIGINT NOT NULL,
	producto_id BIGINT NOT NULL,
	descripcion VARCHAR(255) NOT NULL,
	cantidad DECIMAL(19, 3) NOT NULL,
	costo_unitario DECIMAL(19, 2) NOT NULL,
	total_linea DECIMAL(19, 2) NOT NULL,
	PRIMARY KEY (id),
	INDEX idx_detalle_compra_compra_id (compra_id),
	INDEX idx_detalle_compra_producto_id (producto_id),
	CONSTRAINT fk_detalle_compra_compra FOREIGN KEY (compra_id) REFERENCES compra (id),
	CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (producto_id) REFERENCES producto (id)
) ENGINE=InnoDB;
