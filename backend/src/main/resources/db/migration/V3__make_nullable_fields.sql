-- =============================================
-- V3__make_nullable_fields.sql
-- Permitir campos opcionales según decisiones de diseño
-- =============================================

-- Cliente nullable en factura_venta (ventas sin cliente)
ALTER TABLE factura_venta ALTER COLUMN cliente_id DROP NOT NULL;

-- Producto nullable en detalle_factura (servicios/horas)
ALTER TABLE detalle_factura ALTER COLUMN producto_id DROP NOT NULL;

-- Producto nullable en detalle_compra (servicios/horas)
ALTER TABLE detalle_compra ALTER COLUMN producto_id DROP NOT NULL;