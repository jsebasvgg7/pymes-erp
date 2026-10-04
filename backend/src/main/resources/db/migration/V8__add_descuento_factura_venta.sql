ALTER TABLE factura_venta
    ADD COLUMN descuento DECIMAL(19,2) NOT NULL DEFAULT 0;

ALTER TABLE factura_venta
    ADD CONSTRAINT chk_factura_venta_descuento CHECK (descuento >= 0 AND descuento <= subtotal);
