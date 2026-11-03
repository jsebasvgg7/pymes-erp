\if :{?empresa}
\else
\echo Falta la empresa. Uso: psql "TU_CADENA_DE_CONEXION" -v empresa=ID -f verificar_carga.sql
\quit
\endif

\pset format aligned
\pset tuples_only off
\pset null '-'

BEGIN TRANSACTION READ ONLY;

\echo
\echo === Resumen de la empresa ===
SELECT 'empresa' AS dato, e.nombre AS valor FROM empresa e WHERE e.id = :empresa
UNION ALL SELECT 'usuarios', COUNT(*)::text FROM usuario WHERE empresa_id = :empresa
UNION ALL SELECT 'roles', COUNT(*)::text FROM rol WHERE empresa_id = :empresa
UNION ALL SELECT 'productos', COUNT(*)::text FROM producto WHERE empresa_id = :empresa
UNION ALL SELECT 'clientes', COUNT(*)::text FROM cliente WHERE empresa_id = :empresa
UNION ALL SELECT 'proveedores', COUNT(*)::text FROM proveedor WHERE empresa_id = :empresa
UNION ALL SELECT 'cajas activas', COUNT(*)::text FROM caja WHERE empresa_id = :empresa AND active
UNION ALL SELECT 'aperturas cerradas', COUNT(*)::text FROM apertura_caja WHERE empresa_id = :empresa AND estado = 'CERRADA'
UNION ALL SELECT 'aperturas abiertas', COUNT(*)::text FROM apertura_caja WHERE empresa_id = :empresa AND estado = 'ABIERTA'
UNION ALL SELECT 'facturas', COUNT(*)::text FROM factura_venta WHERE empresa_id = :empresa
UNION ALL SELECT 'compras', COUNT(*)::text FROM compra WHERE empresa_id = :empresa
UNION ALL SELECT 'movimientos de caja', COUNT(*)::text FROM movimiento_caja WHERE empresa_id = :empresa
UNION ALL SELECT 'cuentas por cobrar', COUNT(*)::text FROM cuenta_por_cobrar WHERE empresa_id = :empresa
UNION ALL SELECT 'ajustes de inventario', COUNT(*)::text FROM movimiento_inventario WHERE empresa_id = :empresa
UNION ALL SELECT 'fotos semanales', COUNT(*)::text FROM inventario_semanal WHERE empresa_id = :empresa
UNION ALL SELECT 'primera factura', MIN(fecha_emision)::text FROM factura_venta WHERE empresa_id = :empresa
UNION ALL SELECT 'ultima factura', MAX(fecha_emision)::text FROM factura_venta WHERE empresa_id = :empresa
UNION ALL SELECT 'ventas totales', COALESCE(SUM(total), 0)::text FROM factura_venta WHERE empresa_id = :empresa
UNION ALL SELECT 'compras totales', COALESCE(SUM(total), 0)::text FROM compra WHERE empresa_id = :empresa;

\echo
\echo === Saldos de caja ===
SELECT nombre AS caja, saldo_inicial, saldo_actual FROM caja WHERE empresa_id = :empresa AND active ORDER BY nombre;

\echo
\echo === Estado de las cuentas por cobrar ===
SELECT estado, COUNT(*) AS cuentas, SUM(saldo) AS saldo_pendiente FROM cuenta_por_cobrar WHERE empresa_id = :empresa GROUP BY estado ORDER BY estado;

\echo
\echo === Aperturas por usuario ===
SELECT u.username, COUNT(*) AS aperturas
FROM apertura_caja a JOIN usuario u ON u.id = a.usuario_apertura_id
WHERE a.empresa_id = :empresa GROUP BY u.username ORDER BY u.username;

\echo
\echo === Verificaciones (obtenido debe ser 0) ===
WITH movimiento AS (
    SELECT m.*, CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE -m.monto END AS neto
    FROM movimiento_caja m WHERE m.empresa_id = :empresa
),
efectivo_apertura AS (
    SELECT m.apertura_id, SUM(m.neto) AS neto
    FROM movimiento m JOIN forma_pago fp ON fp.id = m.forma_pago_id
    WHERE fp.tipo = 'EFECTIVO' GROUP BY m.apertura_id
),
ingreso_factura AS (
    SELECT referencia_id, COUNT(*) AS n, SUM(monto) AS total
    FROM movimiento WHERE tipo_referencia = 'FACTURA_VENTA' AND tipo = 'INGRESO' GROUP BY referencia_id
),
egreso_compra AS (
    SELECT referencia_id, forma_pago_id, COUNT(*) AS n, SUM(monto) AS total
    FROM movimiento WHERE tipo_referencia = 'COMPRA' AND tipo = 'EGRESO' GROUP BY referencia_id, forma_pago_id
),
saldo_corrido AS (
    SELECT m.caja_id,
           c.saldo_inicial + SUM(m.neto) OVER (PARTITION BY m.caja_id ORDER BY m.fecha, m.tipo DESC, m.id) AS saldo
    FROM movimiento m JOIN caja c ON c.id = m.caja_id
),
foto AS (
    SELECT w.producto_id, w.semana_inicio, w.cantidad,
           LEAD(w.semana_inicio) OVER (PARTITION BY w.producto_id ORDER BY w.semana_inicio) AS sig_semana,
           LEAD(w.cantidad) OVER (PARTITION BY w.producto_id ORDER BY w.semana_inicio) AS sig_cantidad
    FROM inventario_semanal w WHERE w.empresa_id = :empresa
),
ventas_semana AS (
    SELECT d.producto_id, date_trunc('week', f.fecha_emision)::date AS semana, SUM(d.cantidad) AS cantidad
    FROM detalle_factura d JOIN factura_venta f ON f.id = d.factura_venta_id
    WHERE f.empresa_id = :empresa GROUP BY 1, 2
),
compras_semana AS (
    SELECT d.producto_id, date_trunc('week', c.fecha_compra)::date AS semana, SUM(d.cantidad) AS cantidad
    FROM detalle_compra d JOIN compra c ON c.id = d.compra_id
    WHERE c.empresa_id = :empresa GROUP BY 1, 2
),
ajustes_semana AS (
    SELECT producto_id, date_trunc('week', created_at)::date AS semana, SUM(diferencia) AS cantidad
    FROM movimiento_inventario WHERE empresa_id = :empresa GROUP BY 1, 2
),
verificaciones(grupo, verificacion, obtenido) AS (
    VALUES
    ('caja', 'saldo_actual distinto de saldo_inicial mas movimientos', (
        SELECT COUNT(*) FROM caja c WHERE c.empresa_id = :empresa AND c.saldo_actual <>
            c.saldo_inicial + COALESCE((SELECT SUM(m.neto) FROM movimiento m WHERE m.caja_id = c.id), 0))),
    ('caja', 'saldo corrido negativo en algun momento', (SELECT COUNT(*) FROM saldo_corrido WHERE saldo < 0)),
    ('caja', 'aperturas todavia abiertas', (
        SELECT COUNT(*) FROM apertura_caja WHERE empresa_id = :empresa AND estado = 'ABIERTA')),
    ('caja', 'efectivo esperado distinto de inicial mas movimientos en efectivo', (
        SELECT COUNT(*) FROM apertura_caja a LEFT JOIN efectivo_apertura e ON e.apertura_id = a.id
        WHERE a.empresa_id = :empresa AND a.efectivo_esperado <> a.efectivo_inicial + COALESCE(e.neto, 0))),
    ('caja', 'diferencia distinta de contado menos esperado', (
        SELECT COUNT(*) FROM apertura_caja WHERE empresa_id = :empresa
            AND diferencia <> efectivo_contado - efectivo_esperado)),
    ('caja', 'efectivo contado negativo', (
        SELECT COUNT(*) FROM apertura_caja WHERE empresa_id = :empresa AND efectivo_contado < 0)),
    ('caja', 'movimientos sin apertura o de otra caja', (
        SELECT COUNT(*) FROM movimiento m LEFT JOIN apertura_caja a ON a.id = m.apertura_id
        WHERE a.id IS NULL OR a.caja_id <> m.caja_id)),
    ('caja', 'movimientos fuera de la ventana de su apertura', (
        SELECT COUNT(*) FROM movimiento m JOIN apertura_caja a ON a.id = m.apertura_id
        WHERE m.fecha < a.fecha_apertura OR m.fecha > a.fecha_cierre)),
    ('caja', 'dias sin apertura para alguna caja', (
        SELECT COUNT(*) FROM (
            SELECT d::date AS dia, c.id AS caja_id
            FROM caja c
            CROSS JOIN generate_series(
                (SELECT MIN(fecha_apertura)::date FROM apertura_caja WHERE empresa_id = :empresa),
                (SELECT MAX(fecha_apertura)::date FROM apertura_caja WHERE empresa_id = :empresa),
                INTERVAL '1 day') d
            WHERE c.empresa_id = :empresa AND c.active
        ) x WHERE NOT EXISTS (
            SELECT 1 FROM apertura_caja a WHERE a.caja_id = x.caja_id AND a.fecha_apertura::date = x.dia))),
    ('ventas', 'total distinto de subtotal menos descuento', (
        SELECT COUNT(*) FROM factura_venta WHERE empresa_id = :empresa AND total <> subtotal - descuento)),
    ('ventas', 'subtotal distinto de la suma de lineas', (
        SELECT COUNT(*) FROM factura_venta f WHERE f.empresa_id = :empresa AND f.subtotal <>
            COALESCE((SELECT SUM(d.total_linea) FROM detalle_factura d WHERE d.factura_venta_id = f.id), 0))),
    ('ventas', 'linea distinta de cantidad por precio', (
        SELECT COUNT(*) FROM detalle_factura d JOIN factura_venta f ON f.id = d.factura_venta_id
        WHERE f.empresa_id = :empresa AND d.total_linea <> ROUND(d.cantidad * d.precio_unitario, 2))),
    ('ventas', 'facturas sin lineas', (
        SELECT COUNT(*) FROM factura_venta f WHERE f.empresa_id = :empresa
            AND NOT EXISTS (SELECT 1 FROM detalle_factura d WHERE d.factura_venta_id = f.id))),
    ('ventas', 'numeros de factura repetidos', (
        SELECT COUNT(*) FROM (SELECT numero FROM factura_venta WHERE empresa_id = :empresa
            GROUP BY numero HAVING COUNT(*) > 1) x)),
    ('ventas', 'factura de contado sin exactamente un ingreso', (
        SELECT COUNT(*) FROM factura_venta f JOIN forma_pago fp ON fp.id = f.forma_pago_id
        LEFT JOIN ingreso_factura g ON g.referencia_id = f.id
        WHERE f.empresa_id = :empresa AND fp.tipo <> 'CREDITO'
            AND (g.n IS DISTINCT FROM 1 OR g.total <> f.total))),
    ('ventas', 'factura a credito con movimiento de caja', (
        SELECT COUNT(*) FROM factura_venta f JOIN forma_pago fp ON fp.id = f.forma_pago_id
        WHERE f.empresa_id = :empresa AND fp.tipo = 'CREDITO' AND EXISTS (
            SELECT 1 FROM movimiento m WHERE m.tipo_referencia = 'FACTURA_VENTA' AND m.referencia_id = f.id))),
    ('ventas', 'factura a credito sin cliente', (
        SELECT COUNT(*) FROM factura_venta f JOIN forma_pago fp ON fp.id = f.forma_pago_id
        WHERE f.empresa_id = :empresa AND fp.tipo = 'CREDITO' AND f.cliente_id IS NULL)),
    ('cartera', 'cuenta con saldo fuera de 0 y el monto original', (
        SELECT COUNT(*) FROM cuenta_por_cobrar WHERE empresa_id = :empresa
            AND (saldo < 0 OR saldo > monto_original))),
    ('cartera', 'saldo distinto de original menos abonos', (
        SELECT ABS(COALESCE((SELECT SUM(monto_original - saldo) FROM cuenta_por_cobrar WHERE empresa_id = :empresa), 0)
            - COALESCE((SELECT SUM(monto) FROM movimiento WHERE tipo_referencia = 'CUENTA_POR_COBRAR'), 0)))),
    ('cartera', 'estado de cuenta incoherente con su saldo', (
        SELECT COUNT(*) FROM cuenta_por_cobrar WHERE empresa_id = :empresa AND estado <>
            CASE WHEN saldo = 0 THEN 'PAGADA' WHEN saldo = monto_original THEN 'ABIERTA' ELSE 'PARCIAL' END)),
    ('cartera', 'factura pagada sin cuenta en saldo 0', (
        SELECT COUNT(*) FROM factura_venta f WHERE f.empresa_id = :empresa AND f.estado = 'PAGADA'
            AND NOT EXISTS (SELECT 1 FROM cuenta_por_cobrar c WHERE c.factura_venta_id = f.id AND c.saldo = 0))),
    ('cartera', 'cuenta en saldo 0 con factura no pagada', (
        SELECT COUNT(*) FROM cuenta_por_cobrar c JOIN factura_venta f ON f.id = c.factura_venta_id
        WHERE c.empresa_id = :empresa AND c.saldo = 0 AND f.estado <> 'PAGADA')),
    ('cartera', 'factura a credito sin su cuenta por cobrar', (
        SELECT COUNT(*) FROM factura_venta f JOIN forma_pago fp ON fp.id = f.forma_pago_id
        WHERE f.empresa_id = :empresa AND fp.tipo = 'CREDITO' AND NOT EXISTS (
            SELECT 1 FROM cuenta_por_cobrar c WHERE c.factura_venta_id = f.id))),
    ('cartera', 'abonos que no son ingresos', (
        SELECT COUNT(*) FROM movimiento WHERE tipo_referencia = 'CUENTA_POR_COBRAR' AND tipo <> 'INGRESO')),
    ('compras', 'total distinto de la suma de lineas', (
        SELECT COUNT(*) FROM compra c WHERE c.empresa_id = :empresa AND (c.subtotal <> c.total OR c.total <>
            COALESCE((SELECT SUM(d.total_linea) FROM detalle_compra d WHERE d.compra_id = c.id), 0)))),
    ('compras', 'linea distinta de cantidad por costo', (
        SELECT COUNT(*) FROM detalle_compra d JOIN compra c ON c.id = d.compra_id
        WHERE c.empresa_id = :empresa AND d.total_linea <> ROUND(d.cantidad * d.costo_unitario, 2))),
    ('compras', 'compra sin exactamente un egreso', (
        SELECT COUNT(*) FROM compra c
        LEFT JOIN egreso_compra g ON g.referencia_id = c.id AND g.forma_pago_id = c.forma_pago_id
        WHERE c.empresa_id = :empresa AND (g.n IS DISTINCT FROM 1 OR g.total <> c.total))),
    ('compras', 'egresos de compra sin compra', (
        SELECT COUNT(*) FROM movimiento m WHERE m.tipo_referencia = 'COMPRA'
            AND NOT EXISTS (SELECT 1 FROM compra c WHERE c.id = m.referencia_id))),
    ('compras', 'compra pagada a credito o sin forma de pago', (
        SELECT COUNT(*) FROM compra c LEFT JOIN forma_pago fp ON fp.id = c.forma_pago_id
        WHERE c.empresa_id = :empresa AND (fp.id IS NULL OR fp.tipo = 'CREDITO'))),
    ('compras', 'numeros de compra repetidos', (
        SELECT COUNT(*) FROM (SELECT numero_documento FROM compra WHERE empresa_id = :empresa
            GROUP BY numero_documento HAVING COUNT(*) > 1) x)),
    ('inventario', 'cantidad actual distinta de ajustes mas compras menos ventas', (
        SELECT COUNT(*) FROM inventario i WHERE i.empresa_id = :empresa AND i.cantidad_actual <>
            COALESCE((SELECT SUM(mi.diferencia) FROM movimiento_inventario mi WHERE mi.producto_id = i.producto_id), 0)
          + COALESCE((SELECT SUM(d.cantidad) FROM detalle_compra d WHERE d.producto_id = i.producto_id), 0)
          - COALESCE((SELECT SUM(d.cantidad) FROM detalle_factura d WHERE d.producto_id = i.producto_id), 0))),
    ('inventario', 'foto semanal distinta de la anterior mas movimientos de la semana', (
        SELECT COUNT(*) FROM foto s
        LEFT JOIN ventas_semana v ON v.producto_id = s.producto_id AND v.semana = s.semana_inicio
        LEFT JOIN compras_semana c ON c.producto_id = s.producto_id AND c.semana = s.semana_inicio
        LEFT JOIN ajustes_semana a ON a.producto_id = s.producto_id AND a.semana = s.semana_inicio
        WHERE s.sig_semana = s.semana_inicio + 7
          AND s.sig_cantidad <> s.cantidad + COALESCE(a.cantidad, 0) + COALESCE(c.cantidad, 0) - COALESCE(v.cantidad, 0))),
    ('inventario', 'stock o foto semanal negativos', (
        SELECT (SELECT COUNT(*) FROM inventario WHERE empresa_id = :empresa AND cantidad_actual < 0)
             + (SELECT COUNT(*) FROM inventario_semanal WHERE empresa_id = :empresa AND cantidad < 0))),
    ('inventario', 'producto sin registro de inventario', (
        SELECT COUNT(*) FROM producto p WHERE p.empresa_id = :empresa
            AND NOT EXISTS (SELECT 1 FROM inventario i WHERE i.producto_id = p.id))),
    ('inventario', 'costo promedio no positivo', (
        SELECT COUNT(*) FROM inventario WHERE empresa_id = :empresa AND costo_promedio <= 0)),
    ('usuarios', 'usuarios activos sin rol', (
        SELECT COUNT(*) FROM usuario u WHERE u.empresa_id = :empresa AND u.active
            AND NOT EXISTS (SELECT 1 FROM usuario_rol ur WHERE ur.usuario_id = u.id))),
    ('usuarios', 'empresa sin usuario ADMIN', (
        SELECT CASE WHEN EXISTS (
            SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id = ur.rol_id
            WHERE r.empresa_id = :empresa AND r.nombre = 'ADMIN') THEN 0 ELSE 1 END)),
    ('usuarios', 'roles distintos de ADMIN sin modulos', (
        SELECT COUNT(*) FROM rol r WHERE r.empresa_id = :empresa AND r.nombre <> 'ADMIN'
            AND NOT EXISTS (SELECT 1 FROM rol_modulos rm WHERE rm.rol_id = r.id))),
    ('usuarios', 'aperturas abiertas o cerradas por un ADMIN', (
        SELECT COUNT(*) FROM apertura_caja a WHERE a.empresa_id = :empresa AND (
            EXISTS (SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id = ur.rol_id
                    WHERE ur.usuario_id IN (a.usuario_apertura_id, a.usuario_cierre_id) AND r.nombre = 'ADMIN')))),
    ('usuarios', 'apertura abierta y cerrada por usuarios distintos', (
        SELECT COUNT(*) FROM apertura_caja WHERE empresa_id = :empresa AND usuario_apertura_id <> usuario_cierre_id)),
    ('usuarios', 'usuario en dos cajas el mismo dia', (
        SELECT COUNT(*) FROM (SELECT usuario_apertura_id, fecha_apertura::date
            FROM apertura_caja WHERE empresa_id = :empresa
            GROUP BY 1, 2 HAVING COUNT(*) > 1) x)),
    ('estructura', 'formas de pago activas que no son exactamente una por tipo', (
        SELECT COUNT(*) FROM (VALUES ('EFECTIVO'), ('TARJETA'), ('TRANSFERENCIA'), ('CREDITO')) t(tipo)
        WHERE (SELECT COUNT(*) FROM forma_pago WHERE empresa_id = :empresa AND active AND tipo = t.tipo) <> 1)),
    ('estructura', 'indices temporales de carga sin borrar', (
        SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'tmp_carga%')),
    ('aislamiento', 'facturas con cliente o forma de pago de otra empresa', (
        SELECT COUNT(*) FROM factura_venta f
        LEFT JOIN cliente c ON c.id = f.cliente_id LEFT JOIN forma_pago fp ON fp.id = f.forma_pago_id
        WHERE f.empresa_id = :empresa AND (c.empresa_id <> f.empresa_id OR fp.empresa_id <> f.empresa_id))),
    ('aislamiento', 'lineas de venta con producto de otra empresa', (
        SELECT COUNT(*) FROM detalle_factura d JOIN factura_venta f ON f.id = d.factura_venta_id
        JOIN producto p ON p.id = d.producto_id WHERE f.empresa_id = :empresa AND p.empresa_id <> f.empresa_id)),
    ('aislamiento', 'compras con proveedor o forma de pago de otra empresa', (
        SELECT COUNT(*) FROM compra c JOIN proveedor pr ON pr.id = c.proveedor_id
        LEFT JOIN forma_pago fp ON fp.id = c.forma_pago_id
        WHERE c.empresa_id = :empresa AND (pr.empresa_id <> c.empresa_id OR fp.empresa_id <> c.empresa_id))),
    ('aislamiento', 'lineas de compra con producto de otra empresa', (
        SELECT COUNT(*) FROM detalle_compra d JOIN compra c ON c.id = d.compra_id
        JOIN producto p ON p.id = d.producto_id WHERE c.empresa_id = :empresa AND p.empresa_id <> c.empresa_id)),
    ('aislamiento', 'movimientos de caja con caja, forma de pago o apertura de otra empresa', (
        SELECT COUNT(*) FROM movimiento m JOIN caja ca ON ca.id = m.caja_id
        LEFT JOIN forma_pago fp ON fp.id = m.forma_pago_id LEFT JOIN apertura_caja a ON a.id = m.apertura_id
        WHERE ca.empresa_id <> m.empresa_id OR fp.empresa_id <> m.empresa_id OR a.empresa_id <> m.empresa_id)),
    ('aislamiento', 'aperturas con caja o usuario de otra empresa', (
        SELECT COUNT(*) FROM apertura_caja a JOIN caja ca ON ca.id = a.caja_id
        JOIN usuario ua ON ua.id = a.usuario_apertura_id LEFT JOIN usuario uc ON uc.id = a.usuario_cierre_id
        WHERE a.empresa_id = :empresa AND (ca.empresa_id <> a.empresa_id OR ua.empresa_id <> a.empresa_id
            OR uc.empresa_id <> a.empresa_id))),
    ('aislamiento', 'cuentas con cliente o factura de otra empresa', (
        SELECT COUNT(*) FROM cuenta_por_cobrar c JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN factura_venta f ON f.id = c.factura_venta_id
        WHERE c.empresa_id = :empresa AND (cl.empresa_id <> c.empresa_id OR f.empresa_id <> c.empresa_id))),
    ('aislamiento', 'inventario o fotos con producto de otra empresa', (
        SELECT (SELECT COUNT(*) FROM inventario i JOIN producto p ON p.id = i.producto_id
                WHERE i.empresa_id = :empresa AND p.empresa_id <> i.empresa_id)
             + (SELECT COUNT(*) FROM inventario_semanal w JOIN producto p ON p.id = w.producto_id
                WHERE w.empresa_id = :empresa AND p.empresa_id <> w.empresa_id))),
    ('aislamiento', 'ajustes con producto o usuario de otra empresa', (
        SELECT COUNT(*) FROM movimiento_inventario mi JOIN producto p ON p.id = mi.producto_id
        LEFT JOIN usuario u ON u.id = mi.usuario_id
        WHERE mi.empresa_id = :empresa AND (p.empresa_id <> mi.empresa_id OR u.empresa_id <> mi.empresa_id))),
    ('aislamiento', 'usuarios con roles de otra empresa', (
        SELECT COUNT(*) FROM usuario_rol ur JOIN usuario u ON u.id = ur.usuario_id JOIN rol r ON r.id = ur.rol_id
        WHERE u.empresa_id = :empresa AND r.empresa_id <> u.empresa_id)),
    ('aislamiento', 'productos con categoria de otra empresa', (
        SELECT COUNT(*) FROM producto p JOIN categoria_producto c ON c.id = p.categoria_id
        WHERE p.empresa_id = :empresa AND c.empresa_id <> p.empresa_id))
)
SELECT grupo, verificacion, obtenido, CASE WHEN obtenido = 0 THEN 'OK' ELSE 'FALLA' END AS estado
FROM verificaciones;

\echo
\echo === Avisos (no son fallas) ===
SELECT 'gastos sobre ventas, esperado entre 9 y 11 %' AS aviso,
       ROUND(100.0 * g.total / v.total, 2) AS porcentaje,
       CASE WHEN 100.0 * g.total / v.total BETWEEN 9 AND 11 THEN 'OK' ELSE 'REVISAR' END AS estado
FROM (SELECT COALESCE(SUM(monto), 0) AS total FROM movimiento_caja
      WHERE empresa_id = :empresa AND tipo_referencia = 'GASTO') g,
     (SELECT NULLIF(SUM(total), 0) AS total FROM factura_venta WHERE empresa_id = :empresa) v;

COMMIT;
