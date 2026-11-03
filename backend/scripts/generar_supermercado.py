import argparse
import calendar
import csv
import math
import random
from collections import defaultdict
from dataclasses import dataclass, field, replace
from datetime import date, datetime, time, timedelta
from decimal import ROUND_CEILING, ROUND_DOWN, ROUND_HALF_UP, Decimal, getcontext
from pathlib import Path

SEMANAS = 52
CENTAVOS = Decimal("0.01")
MILESIMAS = Decimal("0.001")
UNIDADES_DECIMALES = {"KILOGRAMO", "GRAMO", "LITRO", "MILILITRO"}
PESOS_DIA = (0.88, 0.84, 0.90, 0.96, 1.18, 1.42, 0.82)
HORAS = tuple(range(7, 21))
PESOS_HORA = (3, 4, 5, 7, 9, 8, 6, 5, 5, 6, 8, 9, 6, 3)
FORMAS_PAGO = (("EFECTIVO", 0.55), ("TARJETA", 0.22), ("TRANSFERENCIA", 0.18), ("CREDITO", 0.05))
CAJAS = (("Caja Principal", 0.65), ("Caja 2", 0.35))
TAMANOS_CANASTA = (1, 1, 2, 2, 3, 3, 4, 5, 6)
EFECTIVO_INICIAL = (40000, 50000, 60000, 80000, 100000)
VENTA_MINIMA_CREDITO = Decimal(8000)
TAMANO_LOTE_SQL = 400
SEMANA_SANTA = (date(2026, 3, 26), date(2026, 4, 5))
PRIMER_DIA_SANTO = date(2026, 3, 30)
getcontext().prec = 60
CAJA_PRINCIPAL = CAJAS[0][0]
FORMAS_COMPRA = (("TRANSFERENCIA", 0.75), ("TARJETA", 0.25))
FORMAS_ABONO = (("EFECTIVO", 0.55), ("TRANSFERENCIA", 0.45))
VARIACION_COSTO = 0.03
HORA_COMPRA_FINAL = time(21, 5)
MOROSOS = 3
CAPITAL_MARGEN = Decimal(1000000)
CAPITAL_PASO = Decimal(1000000)
GASTOS_MIN_PCT = 9.0
GASTOS_MAX_PCT = 11.0
MESES = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)
GASTOS_MENSUALES = (
    ("Nómina", 0, 3100000, 0.0, False),
    ("Arriendo", 5, 1800000, 0.0, False),
    ("Energía", 12, 950000, 0.15, True),
    ("Agua", 14, 220000, 0.05, False),
    ("Internet", 8, 120000, 0.0, False),
    ("Gas", 20, 180000, 0.08, False),
)
GASTOS_MENORES = (
    ("Insumos de aseo", 15000, 60000, 4.0),
    ("Papelería", 10000, 45000, 3.5),
    ("Mantenimiento", 40000, 200000, 2.5),
)
HASH_CLAVE_INICIAL = "$2a$10$p/Ab13klVq7/SXQno1xQIec6xUQhqwRh4.SeBhcwGPMGjOXsMJpfi"
MODULOS_VALIDOS = (
    "DASHBOARD", "POS", "CAJA", "INVENTARIO", "COMPRAS", "PRODUCTOS", "CATEGORIAS", "CLIENTES",
    "PROVEEDORES", "REPORTES", "USUARIOS", "ROLES", "CONFIGURACION",
)
ROLES = (
    ("CAJERO", "Atiende el punto de venta y opera la caja", ("POS", "CAJA", "CLIENTES")),
    ("BODEGUERO", "Controla productos, inventario y compras", ("INVENTARIO", "PRODUCTOS", "CATEGORIAS", "COMPRAS", "PROVEEDORES")),
    ("CONTADOR", "Revisa reportes, caja y compras", ("DASHBOARD", "REPORTES", "CAJA", "CLIENTES", "COMPRAS")),
)
USUARIOS = (
    ("mpadilla", "maria.padilla@supermercado.test", "CAJERO"),
    ("jarrieta", "jhon.arrieta@supermercado.test", "CAJERO"),
    ("ycassiani", "yurleidis.cassiani@supermercado.test", "CAJERO"),
    ("ebarrios", "edwin.barrios@supermercado.test", "BODEGUERO"),
    ("dorozco", "doris.orozco@supermercado.test", "CONTADOR"),
)
CAJEROS = tuple(u[0] for u in USUARIOS if u[2] == "CAJERO")
BODEGUERO = next(u[0] for u in USUARIOS if u[2] == "BODEGUERO")

CATEGORIAS = (
    ('ABA', 'Abarrotes y granos', 'shopping-basket'),
    ('LAC', 'Lácteos y huevos', 'milk'),
    ('BEB', 'Bebidas', 'cup-soda'),
    ('CAR', 'Carnes y embutidos', 'beef'),
    ('FRU', 'Frutas y verduras', 'apple'),
    ('ASE', 'Aseo del hogar', 'spray-can'),
    ('CUI', 'Cuidado personal', 'sparkles'),
    ('SNA', 'Snacks y dulces', 'cookie'),
    ('PAN', 'Panadería', 'croissant'),
    ('MAS', 'Mascotas', 'package'),
)

PROVEEDORES = (
    ('P01', 'Distribuidora Caribe de Abarrotes S.A.S.', '900311421', '3015550101', 'pedidos@caribeabarrotes.test', 'Zona Industrial Mamonal, Cartagena'),
    ('P02', 'Granos y Cereales del Sinú Ltda.', '900422532', '3015550102', 'ventas@granossinu.test', 'Km 3 Vía Turbaco, Cartagena'),
    ('P03', 'Lácteos y Derivados del Caribe S.A.', '900533643', '3015550103', 'comercial@lacteoscaribe.test', 'Parque Industrial Ternera, Cartagena'),
    ('P04', 'Bebidas y Refrescos de la Costa S.A.S.', '900644754', '3015550104', 'pedidos@bebidascosta.test', 'Zona Franca La Candelaria, Cartagena'),
    ('P05', 'Distribuciones Cerveceras del Caribe', '900755865', '3015550105', 'ventas@cerveceracaribe.test', 'Barrio Los Alpes, Cartagena'),
    ('P06', 'Frigorífico y Carnes Bolívar S.A.S.', '900866976', '3015550106', 'pedidos@carnesbolivar.test', 'Mercado de Bazurto, Cartagena'),
    ('P07', 'Fruver Mayorista del Caribe', '900977087', '3015550107', 'ventas@fruvercaribe.test', 'Central de Abastos, Cartagena'),
    ('P08', 'Aseo y Hogar Comercial Ltda.', '901088198', '3015550108', 'pedidos@aseohogar.test', 'Calle 30 Zona Industrial, Cartagena'),
    ('P09', 'Cuidado Personal y Cosméticos Distribuciones', '901199209', '3015550109', 'comercial@cuidadopersonal.test', 'Av. Pedro de Heredia, Cartagena'),
    ('P10', 'Dulces y Confitería Nacional S.A.S.', '901210310', '3015550110', 'ventas@dulcesnacional.test', 'Barrio Crespo, Cartagena'),
    ('P11', 'Panificadora El Trigal S.A.S.', '901321421', '3015550111', 'pedidos@panificadoratrigal.test', 'Barrio Manga, Cartagena'),
    ('P12', 'Alimentos y Accesorios para Mascotas Caribe', '901432532', '3015550112', 'ventas@mascotascaribe.test', 'Av. Crisanto Luque, Cartagena'),
)

FILAS_CATALOGO = (
    ('ABA-001', 'Arroz Blanco', 'Abarrotes y granos', 'KILOGRAMO', 4200, 3650, 75.9, 0.9, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-002', 'Arroz Integral', 'Abarrotes y granos', 'KILOGRAMO', 6200, 5400, 5.9, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-003', 'Fríjol Cabecita Negra', 'Abarrotes y granos', 'KILOGRAMO', 7500, 6300, 13.2, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-004', 'Fríjol Rojo', 'Abarrotes y granos', 'KILOGRAMO', 9200, 7650, 7.3, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-005', 'Lentejas', 'Abarrotes y granos', 'KILOGRAMO', 6800, 5800, 6.6, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-006', 'Garbanzo', 'Abarrotes y granos', 'KILOGRAMO', 8800, 7650, 1.3, 0.8, 0.0, 'P02', 'INTERMITENTE', 1, 52, 'NINGUNA', 'AGOTADO', 'SI'),
    ('ABA-007', 'Maíz Pira', 'Abarrotes y granos', 'KILOGRAMO', 5200, 4450, 1.0, 0.8, 0.0, 'P02', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-008', 'Harina de Trigo', 'Abarrotes y granos', 'KILOGRAMO', 3900, 3250, 11.6, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-009', 'Harina de Maíz Precocida 1 kg', 'Abarrotes y granos', 'PAQUETE', 4800, 4200, 29.7, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-010', 'Avena en Hojuelas 400 g', 'Abarrotes y granos', 'PAQUETE', 3800, 3200, 8.2, 0.8, 0.0, 'P02', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-011', 'Azúcar Blanca', 'Abarrotes y granos', 'KILOGRAMO', 4000, 3300, 36.3, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-012', 'Azúcar Morena', 'Abarrotes y granos', 'KILOGRAMO', 4300, 3650, 8.2, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('ABA-013', 'Sal Marina 500 g', 'Abarrotes y granos', 'UNIDAD', 1200, 1000, 14.9, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-014', 'Aceite Vegetal 1 L', 'Abarrotes y granos', 'UNIDAD', 11500, 10000, 23.1, 0.9, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('ABA-015', 'Aceite de Girasol 1 L', 'Abarrotes y granos', 'UNIDAD', 14500, 12050, 1.3, 0.8, 0.0, 'P01', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-016', 'Pasta Espagueti 250 g', 'Abarrotes y granos', 'UNIDAD', 2400, 2000, 39.6, 0.6, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-017', 'Pasta Codo 250 g', 'Abarrotes y granos', 'UNIDAD', 2400, 2000, 18.2, 0.6, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-018', 'Salsa de Tomate 400 g', 'Abarrotes y granos', 'UNIDAD', 4900, 4100, 14.9, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('ABA-019', 'Mayonesa 400 g', 'Abarrotes y granos', 'UNIDAD', 6400, 5450, 9.9, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'AGOTADO', 'SI'),
    ('ABA-020', 'Atún Lata 160 g', 'Abarrotes y granos', 'UNIDAD', 4800, 4100, 23.1, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'SEMANA_SANTA', 'NORMAL', 'SI'),
    ('ABA-021', 'Sardinas Lata 155 g', 'Abarrotes y granos', 'UNIDAD', 4200, 3700, 8.2, 0.8, 0.0, 'P01', 'DESCONTINUADO', 1, 38, 'SEMANA_SANTA', 'NORMAL', 'SI'),
    ('ABA-022', 'Panela Cuadrada', 'Abarrotes y granos', 'UNIDAD', 2800, 2450, 19.8, 0.8, -0.15, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-023', 'Café Molido 250 g', 'Abarrotes y granos', 'UNIDAD', 8900, 7400, 18.2, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('ABA-024', 'Chocolate de Mesa 500 g', 'Abarrotes y granos', 'PAQUETE', 7800, 6700, 9.9, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-025', 'Sopa de Pollo Sobre', 'Abarrotes y granos', 'UNIDAD', 1800, 1550, 6.6, 0.8, 0.0, 'P01', 'DESCONTINUADO', 1, 28, 'NINGUNA', 'NORMAL', 'NO'),
    ('ABA-026', 'Caldo de Gallina Cubos x12', 'Abarrotes y granos', 'CAJA', 3400, 2900, 13.2, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-027', 'Vinagre Blanco 500 ml', 'Abarrotes y granos', 'UNIDAD', 2800, 2300, 1.0, 0.8, 0.0, 'P01', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ABA-028', 'Cereal de Maíz Caja 300 g', 'Abarrotes y granos', 'CAJA', 9800, 8050, 6.6, 0.8, 0.0, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-001', 'Leche Entera Bolsa 1 L', 'Lácteos y huevos', 'UNIDAD', 4200, 3500, 69.3, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-002', 'Leche Deslactosada 1 L', 'Lácteos y huevos', 'UNIDAD', 5200, 4450, 16.5, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('LAC-003', 'Leche Entera Caja 1 L', 'Lácteos y huevos', 'UNIDAD', 4800, 4200, 19.8, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-004', 'Huevos AA Unidad', 'Lácteos y huevos', 'UNIDAD', 700, 600, 198.0, 0.5, 0.05, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-005', 'Huevos AA Cubeta x30', 'Lácteos y huevos', 'PAQUETE', 19500, 16600, 14.9, 0.5, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-006', 'Queso Costeño', 'Lácteos y huevos', 'KILOGRAMO', 24000, 19700, 13.2, 0.5, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-007', 'Queso Doble Crema', 'Lácteos y huevos', 'KILOGRAMO', 26500, 22500, 5.9, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-008', 'Yogurt Vaso 200 ml', 'Lácteos y huevos', 'UNIDAD', 2300, 1850, 29.7, 0.4, 0.15, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-009', 'Yogurt Botella 1 L', 'Lácteos y huevos', 'UNIDAD', 7800, 6550, 11.6, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-010', 'Mantequilla 250 g', 'Lácteos y huevos', 'UNIDAD', 5500, 4550, 9.2, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-011', 'Crema de Leche 200 ml', 'Lácteos y huevos', 'UNIDAD', 3900, 3300, 5.9, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'AGOTADO', 'SI'),
    ('LAC-012', 'Suero Costeño 250 g', 'Lácteos y huevos', 'UNIDAD', 3500, 3000, 13.2, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-013', 'Kumis 1 L', 'Lácteos y huevos', 'UNIDAD', 6900, 5800, 4.6, 0.4, 0.0, 'P03', 'NUEVO', 49, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('LAC-014', 'Leche Condensada Lata', 'Lácteos y huevos', 'UNIDAD', 4800, 4200, 7.3, 0.4, 0.0, 'P03', 'NORMAL', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('BEB-001', 'Gaseosa Cola 400 ml', 'Bebidas', 'UNIDAD', 2200, 1600, 85.8, 0.35, 0.1, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-002', 'Gaseosa Cola 1.5 L', 'Bebidas', 'UNIDAD', 5800, 4300, 39.6, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-003', 'Gaseosa Naranja 1.5 L', 'Bebidas', 'UNIDAD', 5600, 4100, 19.8, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-004', 'Gaseosa Cola 2.5 L', 'Bebidas', 'UNIDAD', 8200, 6000, 26.4, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'BAJO', 'SI'),
    ('BEB-005', 'Agua en Botella 600 ml', 'Bebidas', 'UNIDAD', 1500, 1100, 72.6, 0.35, 0.15, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-006', 'Agua Garrafón 5 L', 'Bebidas', 'UNIDAD', 7900, 6000, 7.3, 0.35, 0.0, 'P04', 'NUEVO', 9, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('BEB-007', 'Jugo de Naranja Natural', 'Bebidas', 'LITRO', 6500, 5000, 7.9, 0.35, 0.0, 'P07', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-008', 'Jugo en Caja 1 L', 'Bebidas', 'UNIDAD', 4200, 3050, 23.1, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-009', 'Té Frío 500 ml', 'Bebidas', 'UNIDAD', 2800, 2100, 19.8, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-010', 'Bebida Energizante 473 ml', 'Bebidas', 'UNIDAD', 4800, 3600, 13.2, 0.35, 0.0, 'P04', 'NUEVO', 12, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('BEB-011', 'Bebida Hidratante 500 ml', 'Bebidas', 'UNIDAD', 3500, 2500, 14.9, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-012', 'Malta 330 ml', 'Bebidas', 'UNIDAD', 2600, 1950, 18.2, 0.35, 0.0, 'P04', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('BEB-013', 'Café Instantáneo Sobre', 'Bebidas', 'UNIDAD', 800, 600, 23.1, 0.35, -0.1, 'P01', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('BEB-014', 'Cerveza Lata 330 ml', 'Bebidas', 'UNIDAD', 3200, 2450, 52.8, 0.9, 0.0, 'P05', 'NORMAL', 1, 52, 'CALOR', 'BAJO', 'SI'),
    ('BEB-015', 'Cerveza Botella 330 ml', 'Bebidas', 'UNIDAD', 3000, 2300, 33.0, 0.9, 0.0, 'P05', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-016', 'Cerveza Lata 473 ml', 'Bebidas', 'UNIDAD', 4200, 3150, 23.1, 0.9, 0.0, 'P05', 'DESCONTINUADO', 1, 41, 'NINGUNA', 'NORMAL', 'SI'),
    ('BEB-017', 'Cerveza Six Pack Lata', 'Bebidas', 'PAQUETE', 17500, 12950, 9.9, 0.9, 0.0, 'P05', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('BEB-018', 'Ron Botella 750 ml', 'Bebidas', 'UNIDAD', 58000, 43500, 4.6, 0.9, 0.0, 'P05', 'NORMAL', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('BEB-019', 'Vino Tinto 750 ml', 'Bebidas', 'UNIDAD', 38000, 29250, 3.3, 0.7, 0.0, 'P05', 'NORMAL', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('BEB-020', 'Aguardiente Botella 750 ml', 'Bebidas', 'UNIDAD', 52000, 39000, 5.9, 0.9, 0.0, 'P05', 'NORMAL', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('CAR-001', 'Pechuga de Pollo', 'Carnes y embutidos', 'KILOGRAMO', 15900, 14150, 26.4, 0.6, 0.1, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-002', 'Muslo de Pollo', 'Carnes y embutidos', 'KILOGRAMO', 11900, 10350, 23.1, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-003', 'Pollo Entero', 'Carnes y embutidos', 'KILOGRAMO', 10900, 9500, 19.8, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-004', 'Carne Molida de Res', 'Carnes y embutidos', 'KILOGRAMO', 24500, 21300, 14.9, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-005', 'Sobrebarriga de Res', 'Carnes y embutidos', 'KILOGRAMO', 29900, 24800, 7.3, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-006', 'Costilla de Cerdo', 'Carnes y embutidos', 'KILOGRAMO', 21900, 18850, 9.9, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('CAR-007', 'Chuleta de Cerdo', 'Carnes y embutidos', 'KILOGRAMO', 19900, 16700, 8.6, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-008', 'Pescado Mojarra', 'Carnes y embutidos', 'KILOGRAMO', 18900, 16450, 6.6, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'SEMANA_SANTA', 'NORMAL', 'SI'),
    ('CAR-009', 'Camarón Pequeño', 'Carnes y embutidos', 'KILOGRAMO', 38000, 32300, 2.6, 0.6, 0.0, 'P06', 'INTERMITENTE', 1, 52, 'SEMANA_SANTA', 'NORMAL', 'SI'),
    ('CAR-010', 'Salchicha Ranchera Paquete', 'Carnes y embutidos', 'PAQUETE', 8500, 7200, 23.1, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-011', 'Jamón de Cerdo Lonjas 200 g', 'Carnes y embutidos', 'PAQUETE', 7600, 6300, 18.2, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-012', 'Chorizo Paquete', 'Carnes y embutidos', 'PAQUETE', 9800, 8700, 9.2, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-013', 'Tocineta 250 g', 'Carnes y embutidos', 'PAQUETE', 9200, 8200, 6.6, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CAR-014', 'Mortadela 250 g', 'Carnes y embutidos', 'PAQUETE', 4900, 4350, 14.9, 0.6, 0.0, 'P06', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-001', 'Banano', 'Frutas y verduras', 'KILOGRAMO', 3200, 2250, 39.6, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-002', 'Plátano Verde', 'Frutas y verduras', 'KILOGRAMO', 3500, 2500, 36.3, 0.4, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-003', 'Plátano Maduro', 'Frutas y verduras', 'KILOGRAMO', 3800, 2600, 19.8, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-004', 'Papa Pastusa', 'Frutas y verduras', 'KILOGRAMO', 3600, 2650, 31.4, 0.4, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-005', 'Yuca', 'Frutas y verduras', 'KILOGRAMO', 2800, 1950, 23.1, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-006', 'Ñame', 'Frutas y verduras', 'KILOGRAMO', 4200, 2850, 9.9, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-007', 'Tomate Chonto', 'Frutas y verduras', 'KILOGRAMO', 4800, 3400, 29.7, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-008', 'Cebolla Cabezona', 'Frutas y verduras', 'KILOGRAMO', 4200, 2800, 26.4, 0.4, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-009', 'Cebolla Larga', 'Frutas y verduras', 'KILOGRAMO', 5500, 3750, 9.9, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-010', 'Zanahoria', 'Frutas y verduras', 'KILOGRAMO', 3000, 2150, 18.2, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-011', 'Limón', 'Frutas y verduras', 'KILOGRAMO', 5200, 3500, 16.5, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-012', 'Aguacate', 'Frutas y verduras', 'KILOGRAMO', 9800, 6750, 13.2, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-013', 'Mango', 'Frutas y verduras', 'KILOGRAMO', 4800, 3450, 14.9, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('FRU-014', 'Naranja', 'Frutas y verduras', 'KILOGRAMO', 3400, 2300, 13.2, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-015', 'Sandía', 'Frutas y verduras', 'KILOGRAMO', 2400, 1700, 14.9, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('FRU-016', 'Piña', 'Frutas y verduras', 'UNIDAD', 4500, 3050, 8.2, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('FRU-017', 'Ajo Cabeza', 'Frutas y verduras', 'UNIDAD', 1200, 900, 19.8, 0.3, 0.0, 'P07', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-001', 'Jabón de Barra', 'Aseo del hogar', 'UNIDAD', 2000, 1500, 28.1, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-002', 'Detergente en Polvo 1 kg', 'Aseo del hogar', 'UNIDAD', 9800, 7650, 14.9, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-003', 'Detergente Líquido 1 L', 'Aseo del hogar', 'UNIDAD', 12800, 9600, 6.6, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'AGOTADO', 'SI'),
    ('ASE-004', 'Suavizante 1 L', 'Aseo del hogar', 'UNIDAD', 8900, 6850, 7.3, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-005', 'Papel Higiénico x4', 'Aseo del hogar', 'PAQUETE', 6500, 4750, 31.4, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-006', 'Papel Higiénico x12', 'Aseo del hogar', 'PAQUETE', 16900, 12700, 13.2, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('ASE-007', 'Rollo de Cocina x2', 'Aseo del hogar', 'PAQUETE', 4800, 3750, 5.9, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-008', 'Cloro 1 L', 'Aseo del hogar', 'UNIDAD', 3600, 2850, 13.2, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-009', 'Desinfectante 1 L', 'Aseo del hogar', 'UNIDAD', 6200, 4650, 11.6, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-010', 'Lavaplatos Crema 500 g', 'Aseo del hogar', 'UNIDAD', 5400, 4250, 16.5, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-011', 'Esponja x3', 'Aseo del hogar', 'PAQUETE', 3600, 2650, 11.6, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-012', 'Escoba', 'Aseo del hogar', 'UNIDAD', 9500, 7400, 1.3, 0.7, 0.0, 'P08', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-013', 'Trapero', 'Aseo del hogar', 'UNIDAD', 8900, 6600, 1.3, 0.7, 0.0, 'P08', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-014', 'Bolsas de Basura x10', 'Aseo del hogar', 'PAQUETE', 4200, 3200, 13.2, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('ASE-015', 'Ambientador Aerosol', 'Aseo del hogar', 'UNIDAD', 8800, 6950, 5.0, 0.7, 0.0, 'P08', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-001', 'Jabón de Tocador', 'Cuidado personal', 'UNIDAD', 3200, 2400, 24.8, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-002', 'Champú 400 ml', 'Cuidado personal', 'UNIDAD', 12900, 8900, 9.2, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-003', 'Acondicionador 400 ml', 'Cuidado personal', 'UNIDAD', 13500, 9600, 4.6, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-004', 'Crema Dental 75 ml', 'Cuidado personal', 'UNIDAD', 5200, 3700, 23.1, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('CUI-005', 'Cepillo Dental', 'Cuidado personal', 'UNIDAD', 3500, 2600, 13.2, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-006', 'Desodorante Roll-on', 'Cuidado personal', 'UNIDAD', 9800, 7050, 9.9, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-007', 'Toallas Higiénicas x10', 'Cuidado personal', 'PAQUETE', 5900, 4250, 14.9, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-008', 'Pañales Etapa 3 x30', 'Cuidado personal', 'PAQUETE', 38000, 27750, 4.6, 0.9, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-009', 'Pañitos Húmedos x80', 'Cuidado personal', 'PAQUETE', 9800, 7150, 7.3, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-010', 'Afeitadora Desechable x2', 'Cuidado personal', 'PAQUETE', 4200, 3100, 5.9, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('CUI-011', 'Protector Solar 120 ml', 'Cuidado personal', 'UNIDAD', 24900, 17950, 3.3, 0.6, 0.0, 'P09', 'NUEVO', 18, 52, 'CALOR', 'AGOTADO', 'SI'),
    ('CUI-012', 'Gel Antibacterial 250 ml', 'Cuidado personal', 'UNIDAD', 7900, 5700, 6.6, 0.6, 0.0, 'P09', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-001', 'Papas Fritas Bolsa 45 g', 'Snacks y dulces', 'UNIDAD', 2200, 1500, 46.2, 0.3, 0.2, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-002', 'Galletas Saladas Paquete', 'Snacks y dulces', 'PAQUETE', 3200, 2250, 23.1, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-003', 'Galletas de Vainilla Paquete', 'Snacks y dulces', 'PAQUETE', 2800, 1900, 19.8, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-004', 'Chocolatina', 'Snacks y dulces', 'UNIDAD', 1800, 1200, 33.0, 0.3, -0.2, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-005', 'Chicles Caja x20', 'Snacks y dulces', 'CAJA', 14000, 9650, 1.3, 0.3, 0.0, 'P10', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-006', 'Helado de Paleta', 'Snacks y dulces', 'UNIDAD', 2500, 1700, 23.1, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'CALOR', 'NORMAL', 'SI'),
    ('SNA-007', 'Maní Salado Bolsa', 'Snacks y dulces', 'UNIDAD', 2000, 1350, 18.2, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-008', 'Platanitos Bolsa', 'Snacks y dulces', 'UNIDAD', 2400, 1700, 19.8, 0.3, 0.1, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-009', 'Dulces Surtidos Bolsa', 'Snacks y dulces', 'UNIDAD', 3800, 2750, 11.6, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-010', 'Barra de Cereal', 'Snacks y dulces', 'UNIDAD', 2200, 1500, 14.9, 0.3, 0.0, 'P10', 'NUEVO', 20, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-011', 'Gomitas Bolsa', 'Snacks y dulces', 'UNIDAD', 3000, 2200, 16.5, 0.3, 0.0, 'P10', 'NUEVO', 15, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-012', 'Chocolate en Barra', 'Snacks y dulces', 'UNIDAD', 3800, 2600, 13.2, 0.3, 0.0, 'P10', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('SNA-013', 'Mentas Paquete', 'Snacks y dulces', 'PAQUETE', 1500, 1100, 9.9, 0.3, 0.0, 'P10', 'DESCONTINUADO', 1, 33, 'NINGUNA', 'NORMAL', 'NO'),
    ('SNA-014', 'Turrón Caja', 'Snacks y dulces', 'CAJA', 9800, 6650, 2.0, 0.3, 0.0, 'P10', 'INTERMITENTE', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('PAN-001', 'Pan Tajado Paquete', 'Panadería', 'PAQUETE', 6200, 3600, 42.9, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'BAJO', 'SI'),
    ('PAN-002', 'Pan Francés Unidad', 'Panadería', 'UNIDAD', 400, 250, 231.0, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-003', 'Pan de Bono Unidad', 'Panadería', 'UNIDAD', 1500, 900, 59.4, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-004', 'Pan Integral Paquete', 'Panadería', 'PAQUETE', 7400, 4600, 9.9, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-005', 'Pan de Hamburguesa x6', 'Panadería', 'PAQUETE', 5800, 3600, 13.2, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-006', 'Pan de Perro Caliente x6', 'Panadería', 'PAQUETE', 5600, 3450, 9.2, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-007', 'Croissant Unidad', 'Panadería', 'UNIDAD', 2800, 1650, 13.2, 0.2, 0.0, 'P11', 'NUEVO', 47, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-008', 'Torta de Vainilla Porción', 'Panadería', 'UNIDAD', 3500, 2050, 11.6, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-009', 'Almojábana Unidad', 'Panadería', 'UNIDAD', 1800, 1050, 19.8, 0.2, 0.0, 'P11', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('PAN-010', 'Panettone Unidad', 'Panadería', 'UNIDAD', 14900, 8950, 2.6, 0.2, 0.0, 'P11', 'INTERMITENTE', 1, 52, 'DICIEMBRE', 'NORMAL', 'SI'),
    ('MAS-001', 'Concentrado Perro Adulto', 'Mascotas', 'KILOGRAMO', 8900, 6850, 13.2, 0.5, 0.0, 'P12', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('MAS-002', 'Concentrado Gato', 'Mascotas', 'KILOGRAMO', 11500, 9300, 7.3, 0.5, 0.0, 'P12', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('MAS-003', 'Concentrado Perro Cachorro', 'Mascotas', 'KILOGRAMO', 10500, 8400, 4.0, 0.5, 0.0, 'P12', 'NUEVO', 26, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('MAS-004', 'Snack para Perro Paquete', 'Mascotas', 'PAQUETE', 6800, 5450, 4.6, 0.5, 0.0, 'P12', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('MAS-005', 'Arena para Gato 4 kg', 'Mascotas', 'PAQUETE', 18900, 14750, 3.3, 0.5, 0.0, 'P12', 'NORMAL', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
    ('MAS-006', 'Shampoo para Mascotas', 'Mascotas', 'UNIDAD', 9800, 8050, 1.3, 0.5, 0.0, 'P12', 'INTERMITENTE', 1, 52, 'NINGUNA', 'NORMAL', 'SI'),
)

NOMBRES = (
    "María", "Carlos", "Luz Marina", "Jhon Jairo", "Yurleidis", "Edwin", "Doris", "Andrés", "Katherine",
    "Luis Fernando", "Sandra", "Wilson", "Diana", "Jorge", "Ana Milena", "Rafael", "Paola", "Hernán",
    "Johana", "Álvaro", "Liliana", "Nelson", "Yesenia", "Fabián", "Mónica", "Óscar", "Tatiana", "Iván",
    "Rosa Elena", "Dairo", "Claudia", "Ever", "Martha", "Yeison", "Lucy",
)
APELLIDOS = (
    "Pérez", "Mendoza", "Ortega", "Castillo", "Támara", "Barrios", "Herrera", "Orozco", "Villalobos",
    "Caballero", "Julio", "Arrieta", "Posada", "Cassiani", "Berrío", "Padilla", "Zúñiga", "Polo",
    "Romero", "Blanco", "Díaz", "Rodríguez", "Guerrero", "Pineda", "Lozano", "Tovar", "Marrugo", "Ruiz",
)
NEGOCIOS = (
    ("Tienda La Esperanza", "900482315"),
    ("Restaurante El Fogón Costeño", "900517842"),
    ("Cafetería Sabor Caribe", "901022764"),
    ("Panadería Dulce Amanecer", "900733108"),
    ("Hospedaje Casa Getsemaní", "901145390"),
    ("Cevichería La Playa", "900968251"),
)
CLIENTES_CREDITO = 14


def construir_clientes():
    rng = random.Random(11)
    usados = set()
    clientes = []
    for i, nombre in enumerate(NOMBRES):
        completo = f"{nombre} {rng.choice(APELLIDOS)} {rng.choice(APELLIDOS)}"
        while True:
            documento = str(rng.randrange(10000000, 1099999999))
            if documento not in usados:
                usados.add(documento)
                break
        clientes.append((completo, documento, f"3{rng.randrange(0, 3)}{rng.randrange(10000000, 99999999)}"))
    for nombre, nit in NEGOCIOS:
        clientes.append((nombre, nit, f"3{rng.randrange(0, 3)}{rng.randrange(10000000, 99999999)}"))
    rng.shuffle(clientes)
    return tuple(clientes)


CLIENTES = construir_clientes()


def lotes(*valores):
    return tuple(Decimal(str(valor)) for valor in valores)


LOTE_UNO = lotes(1, 1, 1, 2, 2, 3)
LOTE_BEBIDA = lotes(1, 1, 2, 3, 6)
LOTE_HUEVOS = lotes(2, 3, 4, 6, 6, 12, 15)
LOTE_KILO = lotes(0.5, 1, 1, 2, 2, 3, 5)
LOTE_CARNE = lotes(0.25, 0.3, 0.4, 0.5, 0.75, 1)
LOTE_LITRO = lotes(0.5, 1, 1, 1.5, 2)
LOTE_RARO = lotes(1, 1, 1, 2)
LOTE_RARO_DECIMAL = lotes(0.5, 1, 1)


def elegir_lotes(unidad, nombre, precio, demanda, perfil):
    decimal = unidad in UNIDADES_DECIMALES
    if perfil == "INTERMITENTE" or demanda < 3:
        return LOTE_RARO_DECIMAL if decimal else LOTE_RARO
    if "Huevo" in nombre:
        return LOTE_HUEVOS
    if unidad == "LITRO":
        return LOTE_LITRO
    if decimal:
        return LOTE_CARNE if precio >= 15000 else LOTE_KILO
    if precio < 3000 and demanda >= 20:
        return LOTE_BEBIDA
    return LOTE_UNO


@dataclass(frozen=True)
class Producto:
    sku: str
    nombre: str
    categoria: str
    unidad: str
    precio: Decimal
    costo: Decimal
    demanda: float
    quincena: float
    tendencia: float
    proveedor: str
    perfil: str
    inicio: int
    fin: int
    estacion: str
    cierre: str
    activo: bool
    lotes: tuple

    @property
    def decimal(self):
        return self.unidad in UNIDADES_DECIMALES

    @property
    def paso(self):
        return Decimal("0.5") if self.decimal else Decimal(1)

    @property
    def lote_medio(self):
        return float(sum(self.lotes) / len(self.lotes))

    @property
    def stock_minimo(self):
        return Decimal(max(2, math.ceil(self.demanda * 0.25)))


def crear_catalogo(filas):
    productos = []
    for f in filas:
        sku, nombre, categoria, unidad, precio, costo, demanda, quincena, tendencia, proveedor, perfil, inicio, fin, estacion, cierre, activo = f
        productos.append(Producto(
            sku, nombre, categoria, unidad, Decimal(precio), Decimal(costo), demanda, quincena, tendencia,
            proveedor, perfil, inicio, fin, estacion, cierre, activo == "SI",
            elegir_lotes(unidad, nombre, precio, demanda, perfil),
        ))
    return tuple(productos)


CATALOGO = crear_catalogo(FILAS_CATALOGO)
POR_SKU = {p.sku: p for p in CATALOGO}


NOMBRE_CLIENTE = {documento: nombre for nombre, documento, _ in CLIENTES}
NOMBRE_PROVEEDOR = {clave: nombre for clave, nombre, *_ in PROVEEDORES}


@dataclass(frozen=True)
class Linea:
    sku: str
    descripcion: str
    cantidad: Decimal
    precio: Decimal
    total: Decimal


@dataclass(frozen=True)
class Factura:
    numero: str
    fecha: datetime
    caja: str
    forma: str
    documento: str
    lineas: tuple
    subtotal: Decimal
    descuento: Decimal
    total: Decimal


@dataclass(frozen=True)
class Apertura:
    dia: date
    caja: str
    apertura: datetime
    cierre: datetime
    inicial: Decimal
    esperado: Decimal
    contado: Decimal
    diferencia: Decimal


@dataclass(frozen=True)
class Ajuste:
    sku: str
    fecha: datetime
    tipo: str
    anterior: Decimal
    nueva: Decimal
    motivo: str


@dataclass(frozen=True)
class Reposicion:
    sku: str
    fecha: datetime
    anterior: Decimal
    cantidad: Decimal


@dataclass(frozen=True)
class LineaCompra:
    sku: str
    descripcion: str
    cantidad: Decimal
    costo: Decimal
    total: Decimal


@dataclass(frozen=True)
class Compra:
    numero: str
    fecha: datetime
    caja: str
    forma: str
    proveedor: str
    lineas: tuple
    total: Decimal


@dataclass(frozen=True)
class Movimiento:
    fecha: datetime
    caja: str
    forma: str
    tipo: str
    monto: Decimal
    descripcion: str
    referencia: str


@dataclass
class Cuenta:
    numero: str
    documento: str
    fecha: datetime
    original: Decimal
    saldo: Decimal
    actualizado: datetime

    @property
    def estado(self):
        if self.saldo == 0:
            return "PAGADA"
        if self.saldo == self.original:
            return "ABIERTA"
        return "PARCIAL"


@dataclass
class Resultado:
    facturas: list = field(default_factory=list)
    aperturas: list = field(default_factory=list)
    ajustes: list = field(default_factory=list)
    reposiciones: list = field(default_factory=list)
    compras: list = field(default_factory=list)
    movimientos: list = field(default_factory=list)
    cuentas: dict = field(default_factory=dict)
    stock_lunes: dict = field(default_factory=dict)
    ventas: dict = field(default_factory=lambda: defaultdict(Decimal))
    stock_final: dict = field(default_factory=dict)
    costo_promedio: dict = field(default_factory=dict)
    capital: dict = field(default_factory=dict)


def poisson(rng, lam):
    if lam <= 0:
        return 0
    if lam > 50:
        return max(0, round(rng.gauss(lam, math.sqrt(lam))))
    limite = math.exp(-lam)
    k = 0
    acumulado = 1.0
    while True:
        acumulado *= rng.random()
        if acumulado <= limite:
            return k
        k += 1


def efecto_quincena(dia, fuerza):
    if dia.day == 15 or dia.day >= 28:
        return 1 + fuerza
    if dia.day in (1, 16):
        return 1 + 0.4 * fuerza
    return 1.0


def efecto_estacional(tipo, dia, inicio):
    if tipo == "CALOR":
        semana = (dia - inicio).days / 7 + 1
        return 1 + 0.25 * math.cos(2 * math.pi * (semana - 22) / 52)
    if tipo == "DICIEMBRE":
        if dia.month != 12:
            return 1.0
        if dia.day <= 15:
            return 1.5
        if dia.day <= 24:
            return 2.3
        return 1.3
    if tipo == "SEMANA_SANTA":
        if PRIMER_DIA_SANTO <= dia <= SEMANA_SANTA[1] - timedelta(days=1):
            return 2.2
        if SEMANA_SANTA[0] <= dia < PRIMER_DIA_SANTO:
            return 1.4
        return 1.0
    return 1.0


def factor_perfil(p, numero):
    if p.perfil == "NUEVO":
        return min(1.0, 0.4 + 0.6 * (numero - p.inicio) / 6)
    if p.perfil == "DESCONTINUADO":
        restante = p.fin - numero
        if restante >= 3:
            return 1.0
        return (0.3, 0.55, 0.8)[max(restante, 0)]
    return 1.0


def intensidad(p, nivel, dia, inicio, numero):
    transcurrido = (dia - inicio).days
    tendencia = 1 + p.tendencia * transcurrido / (SEMANAS * 7)
    return (
        p.demanda / 7 * PESOS_DIA[dia.weekday()] * nivel * tendencia
        * efecto_quincena(dia, p.quincena) * efecto_estacional(p.estacion, dia, inicio)
        * factor_perfil(p, numero)
    )


def generar_niveles(rng, p):
    nivel = 1.0
    niveles = []
    for _ in range(SEMANAS + 1):
        nivel = 1 + 0.7 * (nivel - 1) + rng.gauss(0, 0.08)
        base = max(0.5, nivel)
        if p.perfil == "INTERMITENTE":
            base = 0.0 if rng.random() < 0.35 else base / 0.65
        niveles.append(base)
    return niveles


def redondear_paso(valor, p):
    if p.decimal:
        return Decimal(math.ceil(valor * 2)) / 2
    return Decimal(math.ceil(valor))


def objetivo_stock(rng, p, lunes, inicio, nivel, numero):
    esperado = sum(intensidad(p, nivel, lunes + timedelta(days=i), inicio, numero) for i in range(7))
    bruto = esperado * rng.uniform(1.3, 1.65)
    minimo = Decimal(1) if p.decimal else Decimal(2)
    return max(redondear_paso(bruto, p), minimo)


def planear_stock(rng, p, semana, lunes, inicio, nivel, stock, res):
    numero = semana + 1
    if numero < p.inicio:
        return
    if numero == p.inicio:
        objetivo = objetivo_stock(rng, p, lunes, inicio, nivel, numero)
        fecha = datetime.combine(lunes - timedelta(days=1), time(19, 0))
        res.ajustes.append(Ajuste(p.sku, fecha, "CONTEO", Decimal(0), objetivo, "Inventario inicial"))
        stock[p.sku] = objetivo
        res.stock_lunes[(p.sku, numero)] = objetivo
        return
    if not p.activo and numero > p.fin + 1:
        return
    res.stock_lunes[(p.sku, numero)] = stock[p.sku]
    if numero > p.fin:
        return
    if p.cierre == "AGOTADO" and numero > SEMANAS - 3:
        return
    objetivo = objetivo_stock(rng, p, lunes, inicio, nivel, numero)
    if p.cierre == "BAJO" and numero >= SEMANAS - 1:
        objetivo = max(redondear_paso(float(objetivo) * 0.6, p), Decimal(2))
    if objetivo > stock[p.sku]:
        fecha = datetime.combine(lunes, time(6, rng.randrange(30, 55), rng.randrange(60)))
        res.reposiciones.append(Reposicion(p.sku, fecha, stock[p.sku], objetivo - stock[p.sku]))
        stock[p.sku] = objetivo


def armar_canastas(rng, lineas):
    canastas = []
    indice = 0
    while indice < len(lineas):
        tamano = rng.choice(TAMANOS_CANASTA)
        grupo = {}
        for p, cantidad in lineas[indice:indice + tamano]:
            previo = grupo[p.sku][1] if p.sku in grupo else Decimal(0)
            grupo[p.sku] = (p, previo + cantidad)
        canastas.append(list(grupo.values()))
        indice += tamano
    return canastas


def hora_aleatoria(rng, dia):
    hora = rng.choices(HORAS, weights=PESOS_HORA)[0]
    return datetime.combine(dia, time(hora, rng.randrange(60), rng.randrange(60)))


def limitar(cantidad, disponible, p):
    paso = CENTAVOS if p.decimal else Decimal(1)
    return min(cantidad, disponible).quantize(paso, rounding=ROUND_DOWN)


def simular_dia(rng, dia, semana, inicio, niveles, stock):
    lineas = []
    numero = semana + 1
    for p in CATALOGO:
        if not p.inicio <= numero <= p.fin:
            continue
        lam = intensidad(p, niveles[p.sku][semana], dia, inicio, numero) * rng.lognormvariate(0, 0.10)
        for _ in range(poisson(rng, lam / p.lote_medio)):
            lineas.append((p, rng.choice(p.lotes)))
    rng.shuffle(lineas)
    canastas = armar_canastas(rng, lineas)
    horas = sorted(hora_aleatoria(rng, dia) for _ in canastas)
    vendidas = []
    for canasta, fecha in zip(canastas, horas):
        items = []
        for p, cantidad in canasta:
            real = limitar(cantidad, stock[p.sku], p)
            if real > 0:
                stock[p.sku] -= real
                items.append((p, real))
        if items:
            vendidas.append((fecha, items))
    return vendidas


def facturar(rng, fecha, items, secuencia, documentos, documentos_credito):
    forma = rng.choices([f for f, _ in FORMAS_PAGO], weights=[w for _, w in FORMAS_PAGO])[0]
    caja = rng.choices([c for c, _ in CAJAS], weights=[w for _, w in CAJAS])[0]
    lineas = []
    subtotal = Decimal(0)
    for p, cantidad in items:
        total = (cantidad * p.precio).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
        lineas.append(Linea(p.sku, p.nombre, cantidad, p.precio, total))
        subtotal += total
    if forma == "CREDITO" and subtotal < VENTA_MINIMA_CREDITO:
        forma = "EFECTIVO"
    documento = None
    if forma == "CREDITO":
        documento = rng.choice(documentos_credito)
    elif rng.random() < 0.12:
        documento = rng.choice(documentos)
    descuento = Decimal(0)
    if rng.random() < 0.08:
        porcentaje = Decimal(str(rng.choice((0.05, 0.10))))
        descuento = (subtotal * porcentaje).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
    numero = f"FAC-{fecha:%Y%m%d}-{secuencia:05d}"
    return Factura(numero, fecha, caja, forma, documento, tuple(lineas), subtotal, descuento, subtotal - descuento)


def sortear_inicial(rng):
    return Decimal(rng.choice(EFECTIVO_INICIAL))


def cerrar_caja(rng, dia, caja, inicial, efectivo, ultimo):
    esperado = inicial + efectivo
    sorteo = rng.random()
    if sorteo < 0.70:
        diferencia = 0
    elif sorteo < 0.85:
        diferencia = -rng.randrange(1, 11) * 500
    else:
        diferencia = rng.randrange(1, 7) * 500
    apertura = datetime.combine(dia, time(6, rng.randrange(0, 30), rng.randrange(60)))
    cierre = datetime.combine(dia, time(21, rng.randrange(0, 41), rng.randrange(60)))
    if ultimo:
        cierre = max(cierre, datetime.combine(dia, time(21, 30)))
    return Apertura(dia, caja, apertura, cierre, inicial, esperado, esperado + diferencia, Decimal(diferencia))


def ajustar_cierre(inicio, stock, res):
    dia = inicio + timedelta(days=SEMANAS * 7 - 1)
    fecha = datetime.combine(dia, time(22, 0))
    fecha_compra = datetime.combine(dia, HORA_COMPRA_FINAL)
    for p in CATALOGO:
        if not p.activo:
            continue
        actual = stock[p.sku]
        minimo = p.stock_minimo
        if p.cierre == "AGOTADO":
            if actual > 0:
                res.ajustes.append(Ajuste(p.sku, fecha, "CONTEO", actual, Decimal(0), "Conteo físico: sin existencias"))
                stock[p.sku] = Decimal(0)
        elif p.cierre == "BAJO":
            if not 0 < actual < minimo:
                bajo = max((minimo / 2 / p.paso).to_integral_value(rounding=ROUND_DOWN) * p.paso, p.paso)
                res.ajustes.append(Ajuste(p.sku, fecha, "CONTEO", actual, bajo, "Conteo físico"))
                stock[p.sku] = bajo
        elif actual < minimo:
            objetivo = minimo * 2
            res.reposiciones.append(Reposicion(p.sku, fecha_compra, actual, objetivo - actual))
            stock[p.sku] = objetivo


def variar_costo(rng, p):
    factor = 1 + rng.uniform(-VARIACION_COSTO, VARIACION_COSTO)
    return max(Decimal(10), Decimal(round(float(p.costo) * factor / 10) * 10))


def costo_promedio_nuevo(promedio, anterior, cantidad, costo):
    return ((promedio * anterior + cantidad * costo) / (anterior + cantidad)).quantize(CENTAVOS, rounding=ROUND_HALF_UP)


def construir_compras(rng, res):
    grupos = defaultdict(list)
    for r in res.reposiciones:
        grupos[(POR_SKU[r.sku].proveedor, r.fecha.date())].append(r)
    ordenados = sorted(grupos.items(), key=lambda item: (min(r.fecha for r in item[1]), item[0][0]))
    promedio = {p.sku: p.costo for p in CATALOGO}
    compras = []
    for secuencia, ((proveedor, _), reposiciones) in enumerate(ordenados, start=1):
        fecha = min(r.fecha for r in reposiciones)
        caja = rng.choices([c for c, _ in CAJAS], weights=[w for _, w in CAJAS])[0]
        forma = rng.choices([f for f, _ in FORMAS_COMPRA], weights=[w for _, w in FORMAS_COMPRA])[0]
        lineas = []
        for r in sorted(reposiciones, key=lambda r: r.sku):
            p = POR_SKU[r.sku]
            costo = variar_costo(rng, p)
            total = (r.cantidad * costo).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
            lineas.append(LineaCompra(p.sku, p.nombre, r.cantidad, costo, total))
            promedio[p.sku] = costo_promedio_nuevo(promedio[p.sku], r.anterior, r.cantidad, costo)
        numero = f"COM-{fecha:%Y%m%d}-{secuencia:05d}"
        compras.append(Compra(numero, fecha, caja, forma, proveedor, tuple(lineas), sum((l.total for l in lineas), Decimal(0))))
    res.compras = compras
    res.costo_promedio = promedio


def generar_gastos_fijos(rng, inicio, fin):
    movimientos = []
    anio, mes = inicio.year, inicio.month
    while date(anio, mes, 1) <= fin:
        ultimo = calendar.monthrange(anio, mes)[1]
        for concepto, dia, base, variacion, estacional in GASTOS_MENSUALES:
            fecha = date(anio, mes, ultimo if dia == 0 else dia)
            if not inicio <= fecha <= fin:
                continue
            if estacional:
                valor = base * (1 + variacion * math.cos(2 * math.pi * (mes - 5) / 12))
            else:
                valor = base * (1 + rng.uniform(-variacion, variacion))
            hora = datetime.combine(fecha, time(rng.randrange(8, 18), rng.randrange(60), rng.randrange(60)))
            movimientos.append(Movimiento(
                hora, CAJA_PRINCIPAL, "TRANSFERENCIA", "EGRESO", Decimal(round(valor / 1000) * 1000),
                f"{concepto} - {MESES[mes - 1]} {anio}", "GASTO",
            ))
        mes += 1
        if mes == 13:
            anio, mes = anio + 1, 1
    return movimientos


def generar_menor(rng, dia, inicial, entradas):
    hora = datetime.combine(dia, time(rng.randrange(12, 18), rng.randrange(60), rng.randrange(60)))
    disponible = inicial + sum((monto for fecha, monto in entradas if fecha <= hora), Decimal(0))
    concepto, bajo, alto, _ = rng.choices(GASTOS_MENORES, weights=[g[3] for g in GASTOS_MENORES])[0]
    monto = min(Decimal(rng.randrange(bajo, alto + 1, 1000)), (disponible - 10000) // 1000 * 1000)
    if monto < 10000:
        return None
    return Movimiento(hora, CAJA_PRINCIPAL, "EFECTIVO", "EGRESO", monto, f"{concepto} - gasto menor", "GASTO")


def programar_abono(rng, desde, limite):
    siguiente = desde + timedelta(days=rng.randint(14, 35))
    if limite is not None and siguiente > limite:
        return None
    return siguiente


def ejecutar_abono(rng, dia, documento, cuentas):
    hora = datetime.combine(dia, time(rng.randrange(9, 19), rng.randrange(60), rng.randrange(60)))
    pendientes = [c for c in cuentas if c.fecha <= hora and c.saldo > 0]
    deuda = sum((c.saldo for c in pendientes), Decimal(0))
    if deuda < 1000:
        return None
    if rng.random() < 0.35:
        monto = deuda
    else:
        fraccion = Decimal(str(round(rng.uniform(0.4, 0.99), 2)))
        monto = (deuda * fraccion / 100).to_integral_value(rounding=ROUND_DOWN) * 100
    if monto < 1000:
        return None
    restante = monto
    for cuenta in pendientes:
        aplicado = min(restante, cuenta.saldo)
        cuenta.saldo -= aplicado
        cuenta.actualizado = hora
        restante -= aplicado
        if restante == 0:
            break
    forma = rng.choices([f for f, _ in FORMAS_ABONO], weights=[w for _, w in FORMAS_ABONO])[0]
    return Movimiento(
        hora, CAJA_PRINCIPAL, forma, "INGRESO", monto,
        f"Abono de deuda - Cliente: {NOMBRE_CLIENTE[documento]}", "CUENTA_POR_COBRAR",
    )


def eventos_saldo(res):
    eventos = defaultdict(list)
    for f in res.facturas:
        if f.forma != "CREDITO":
            eventos[f.caja].append((f.fecha, f.total))
    for c in res.compras:
        eventos[c.caja].append((c.fecha, -c.total))
    for m in res.movimientos:
        eventos[m.caja].append((m.fecha, m.monto if m.tipo == "INGRESO" else -m.monto))
    for lista in eventos.values():
        lista.sort(key=lambda e: (e[0], e[1] > 0))
    return eventos


def calcular_capital(res):
    eventos = eventos_saldo(res)
    capital = {}
    for caja, _ in CAJAS:
        saldo = minimo = Decimal(0)
        for _, monto in eventos[caja]:
            saldo += monto
            minimo = min(minimo, saldo)
        if minimo == 0:
            capital[caja] = Decimal(0)
        else:
            capital[caja] = ((-minimo + CAPITAL_MARGEN) / CAPITAL_PASO).to_integral_value(rounding=ROUND_CEILING) * CAPITAL_PASO
    return capital


def simular(rng, rng_c, inicio):
    fin = inicio + timedelta(days=SEMANAS * 7 - 1)
    niveles = {p.sku: generar_niveles(rng, p) for p in CATALOGO}
    stock = {p.sku: Decimal(0) for p in CATALOGO}
    documentos = [c[1] for c in CLIENTES]
    documentos_credito = documentos[:CLIENTES_CREDITO]
    morosos = set(rng_c.sample(documentos_credito, MOROSOS))
    limites = {
        d: inicio + timedelta(weeks=rng_c.randint(14, 36)) if d in morosos else None for d in documentos_credito
    }
    agenda = {d: programar_abono(rng_c, inicio, limites[d]) for d in documentos_credito}
    cuentas_cliente = defaultdict(list)
    res = Resultado()
    secuencia = 0
    for semana in range(SEMANAS):
        lunes = inicio + timedelta(weeks=semana)
        for p in CATALOGO:
            planear_stock(rng, p, semana, lunes, inicio, niveles[p.sku][semana], stock, res)
        dia_menor = lunes + timedelta(days=rng_c.randrange(7))
        for desplazamiento in range(7):
            dia = lunes + timedelta(days=desplazamiento)
            facturas_dia = []
            for fecha, items in simular_dia(rng, dia, semana, inicio, niveles, stock):
                secuencia += 1
                factura = facturar(rng, fecha, items, secuencia, documentos, documentos_credito)
                facturas_dia.append(factura)
                for linea in factura.lineas:
                    res.ventas[(linea.sku, semana + 1)] += linea.cantidad
                if factura.forma == "CREDITO":
                    cuenta = Cuenta(factura.numero, factura.documento, factura.fecha, factura.total, factura.total, factura.fecha)
                    res.cuentas[factura.numero] = cuenta
                    cuentas_cliente[factura.documento].append(cuenta)
            res.facturas.extend(facturas_dia)
            abonos = []
            for documento in documentos_credito:
                if agenda[documento] == dia:
                    abono = ejecutar_abono(rng_c, dia, documento, cuentas_cliente[documento])
                    if abono is not None:
                        abonos.append(abono)
                    agenda[documento] = programar_abono(rng_c, dia, limites[documento])
            for caja, _ in CAJAS:
                inicial = sortear_inicial(rng)
                entradas = [(f.fecha, f.total) for f in facturas_dia if f.caja == caja and f.forma == "EFECTIVO"]
                salidas = Decimal(0)
                if caja == CAJA_PRINCIPAL:
                    entradas += [(a.fecha, a.monto) for a in abonos if a.forma == "EFECTIVO"]
                    if dia == dia_menor:
                        menor = generar_menor(rng_c, dia, inicial, entradas)
                        if menor is not None:
                            res.movimientos.append(menor)
                            salidas = menor.monto
                efectivo = sum((monto for _, monto in entradas), Decimal(0)) - salidas
                res.aperturas.append(cerrar_caja(rng, dia, caja, inicial, efectivo, dia == fin))
            res.movimientos.extend(abonos)
    ajustar_cierre(inicio, stock, res)
    res.movimientos.extend(generar_gastos_fijos(rng_c, inicio, fin))
    construir_compras(rng_c, res)
    for p in CATALOGO:
        if p.activo:
            res.stock_lunes[(p.sku, SEMANAS + 1)] = stock[p.sku]
    res.stock_final = dict(stock)
    res.capital = calcular_capital(res)
    return res


def escalar_quincena(factor):
    global CATALOGO, POR_SKU
    CATALOGO = tuple(replace(p, quincena=p.quincena * factor) for p in CATALOGO)
    POR_SKU = {p.sku: p for p in CATALOGO}


def fallar(mensaje):
    raise SystemExit(f"Validación fallida: {mensaje}")


def facturas_por_dia(res):
    conteo = defaultdict(int)
    for f in res.facturas:
        conteo[f.fecha.date()] += 1
    return conteo


def eventos_efectivo(res):
    eventos = defaultdict(list)
    for f in res.facturas:
        if f.forma == "EFECTIVO":
            eventos[(f.fecha.date(), f.caja)].append((f.fecha, f.total))
    for m in res.movimientos:
        if m.forma == "EFECTIVO":
            eventos[(m.fecha.date(), m.caja)].append((m.fecha, m.monto if m.tipo == "INGRESO" else -m.monto))
    return eventos


def validar_ventas(res):
    numeros = []
    total_lineas = Decimal(0)
    for f in res.facturas:
        numeros.append(f.numero)
        if not 0 <= f.descuento <= f.subtotal or f.total != f.subtotal - f.descuento:
            fallar(f"totales inconsistentes en {f.numero}")
        if f.forma == "CREDITO" and f.documento is None:
            fallar(f"crédito sin cliente en {f.numero}")
        for linea in f.lineas:
            p = POR_SKU[linea.sku]
            if linea.cantidad <= 0 or linea.cantidad != linea.cantidad.quantize(MILESIMAS):
                fallar(f"cantidad inválida en {f.numero}")
            if not p.decimal and linea.cantidad != linea.cantidad.to_integral_value():
                fallar(f"decimales en producto entero {p.sku}")
            total_lineas += linea.cantidad
    if len(set(numeros)) != len(numeros) or numeros != sorted(numeros):
        fallar("la numeración no es única y creciente")
    if len(numeros) >= 100000:
        fallar("la secuencia excede 5 dígitos")
    if sum(res.ventas.values(), Decimal(0)) != total_lineas:
        fallar("las ventas semanales no suman las líneas")
    for p in CATALOGO:
        for numero in range(1, SEMANAS + 1):
            if (numero < p.inicio or numero > p.fin) and res.ventas.get((p.sku, numero), 0) != 0:
                fallar(f"ventas fuera de la vida de {p.sku}")
    conteo = facturas_por_dia(res)
    promedio = sum(conteo.values()) / len(conteo)
    if not 60 <= promedio <= 100:
        fallar(f"promedio de facturas por día fuera de 60 a 100: {promedio:.1f}")


def validar_caja(res):
    if len(res.aperturas) != SEMANAS * 7 * len(CAJAS):
        fallar("falta una apertura por caja y día")
    eventos = eventos_efectivo(res)
    ventana = {}
    for a in res.aperturas:
        ventana[(a.dia, a.caja)] = (a.apertura, a.cierre)
        neto = sum((monto for _, monto in eventos[(a.dia, a.caja)]), Decimal(0))
        if a.esperado != a.inicial + neto:
            fallar(f"esperado inconsistente en {a.caja} {a.dia}")
        if a.diferencia != a.contado - a.esperado:
            fallar(f"diferencia inconsistente en {a.caja} {a.dia}")
        if a.contado < 0:
            fallar(f"efectivo contado negativo en {a.caja} {a.dia}")
        corrido = a.inicial
        for _, monto in sorted(eventos[(a.dia, a.caja)], key=lambda e: (e[0], e[1] > 0)):
            corrido += monto
            if corrido < 0:
                fallar(f"efectivo intradía negativo en {a.caja} {a.dia}")
    registros = [(f.fecha, f.caja) for f in res.facturas]
    registros += [(c.fecha, c.caja) for c in res.compras]
    registros += [(m.fecha, m.caja) for m in res.movimientos]
    for fecha, caja in registros:
        clave = (fecha.date(), caja)
        if clave not in ventana or not ventana[clave][0] <= fecha <= ventana[clave][1]:
            fallar(f"movimiento fuera de apertura en {caja} {fecha}")
    for caja, lista in eventos_saldo(res).items():
        corrido = res.capital[caja]
        for _, monto in lista:
            corrido += monto
            if corrido < 0:
                fallar(f"saldo negativo en {caja}")


def validar_compras(res):
    numeros = [c.numero for c in res.compras]
    if len(set(numeros)) != len(numeros) or numeros != sorted(numeros):
        fallar("la numeración de compras no es única y creciente")
    formas = {f for f, _ in FORMAS_COMPRA}
    for c in res.compras:
        if c.forma not in formas:
            fallar(f"forma de pago inválida en {c.numero}")
        if not c.lineas or c.total != sum((l.total for l in c.lineas), Decimal(0)):
            fallar(f"total de compra inconsistente en {c.numero}")
        if c.total != c.total.quantize(CENTAVOS):
            fallar(f"total sin cuantizar en {c.numero}")
        for l in c.lineas:
            if l.total != l.cantidad * l.costo or l.cantidad <= 0:
                fallar(f"línea de compra inconsistente en {c.numero}")
            base = POR_SKU[l.sku].costo
            if abs(l.costo - base) > base * Decimal(str(VARIACION_COSTO)) + 10:
                fallar(f"costo fuera de rango en {c.numero} {l.sku}")


def validar_cuentas(res):
    abonado = sum((m.monto for m in res.movimientos if m.referencia == "CUENTA_POR_COBRAR"), Decimal(0))
    pendiente = Decimal(0)
    estados = set()
    for c in res.cuentas.values():
        if not 0 <= c.saldo <= c.original:
            fallar(f"saldo inválido en la cuenta {c.numero}")
        pendiente += c.original - c.saldo
        estados.add(c.estado)
    if abonado != pendiente:
        fallar("los abonos no cuadran con las cuentas")
    if estados != {"ABIERTA", "PARCIAL", "PAGADA"}:
        fallar(f"faltan estados de cuenta por cobrar: {sorted(estados)}")


def validar_stock(res):
    cambio = defaultdict(Decimal)
    for a in res.ajustes:
        cambio[a.sku] += a.nueva - a.anterior
    for r in res.reposiciones:
        cambio[r.sku] += r.cantidad
    for (sku, _), cantidad_vendida in res.ventas.items():
        cambio[sku] -= cantidad_vendida
    for p in CATALOGO:
        if cambio[p.sku] != res.stock_final[p.sku]:
            fallar(f"la cadena de stock no cuadra en {p.sku}")
    if any(v < 0 for v in res.stock_final.values()):
        fallar("stock final negativo")
    if any(v < 0 for v in res.stock_lunes.values()):
        fallar("foto semanal negativa")
    for p in CATALOGO:
        if not p.activo:
            continue
        final = res.stock_final[p.sku]
        if p.cierre == "AGOTADO" and final != 0:
            fallar(f"{p.sku} debía quedar agotado")
        if p.cierre == "BAJO" and not 0 < final < p.stock_minimo:
            fallar(f"{p.sku} debía quedar con stock bajo")
        if p.cierre == "NORMAL" and final < p.stock_minimo:
            fallar(f"{p.sku} quedó bajo sin ser de cierre bajo")


def validar(res):
    validar_ventas(res)
    validar_caja(res)
    validar_compras(res)
    validar_cuentas(res)
    validar_stock(res)
    validar_usuarios(res)


def validar_usuarios(res):
    roles = {nombre for nombre, _, _ in ROLES}
    correos = [email for _, email, _ in USUARIOS]
    nombres = [username for username, _, _ in USUARIOS]
    if len(set(correos)) != len(correos) or len(set(nombres)) != len(nombres):
        fallar("usuarios repetidos")
    if any(rol not in roles for _, _, rol in USUARIOS):
        fallar("usuario con rol inexistente")
    if any(not 4 <= len(n) <= 50 for n in nombres):
        fallar("nombre de usuario fuera de rango")
    if any(m not in MODULOS_VALIDOS for _, _, lista in ROLES for m in lista):
        fallar("módulo inexistente en un rol")
    if len(CAJEROS) < len(CAJAS) + 1:
        fallar("hacen falta más cajeros que cajas")
    inicio = min(a.dia for a in res.aperturas)
    por_dia = defaultdict(set)
    for a in res.aperturas:
        por_dia[a.dia].add(asignar_cajero(inicio, a.dia, a.caja))
    if any(len(cajeros) != len(CAJAS) for cajeros in por_dia.values()):
        fallar("un cajero atiende dos cajas el mismo día")


def txt(valor):
    if valor is None:
        return "NULL::varchar"
    return "'" + valor.replace("'", "''") + "'::varchar"


def booleano(valor):
    return "TRUE" if valor else "FALSE"


def fecha_hora(valor):
    return f"'{valor:%Y-%m-%d %H:%M:%S}'::timestamp"


def solo_fecha(valor):
    return f"'{valor:%Y-%m-%d}'::date"


def dinero(valor):
    return f"{valor:.2f}::numeric"


def cantidad(valor):
    return f"{valor:.3f}::numeric"


def en_lotes(cabecera, filas, cierre):
    partes = []
    for i in range(0, len(filas), TAMANO_LOTE_SQL):
        cuerpo = ",\n".join("(" + ", ".join(fila) + ")" for fila in filas[i:i + TAMANO_LOTE_SQL])
        partes.append(f"{cabecera}\n{cuerpo}\n{cierre};\n")
    return "".join(partes)


def sql_guardas(eid, correo):
    return f"""DO $$
DECLARE
    tipo_forma text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id = {eid} AND active) THEN
        RAISE EXCEPTION 'La empresa {eid} no existe';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE empresa_id = {eid} AND email = {txt(correo)} AND active) THEN
        RAISE EXCEPTION 'No existe el usuario % en la empresa {eid}', {txt(correo)};
    END IF;
    IF (SELECT COUNT(*) FROM caja WHERE empresa_id = {eid} AND active) <> 1 THEN
        RAISE EXCEPTION 'La empresa {eid} debe tener exactamente una caja activa';
    END IF;
    FOREACH tipo_forma IN ARRAY ARRAY['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] LOOP
        IF (SELECT COUNT(*) FROM forma_pago WHERE empresa_id = {eid} AND active AND tipo = tipo_forma) <> 1 THEN
            RAISE EXCEPTION 'La empresa {eid} debe tener exactamente una forma de pago %', tipo_forma;
        END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM factura_venta WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM producto WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM categoria_producto WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM cliente WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM proveedor WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM compra WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM rol WHERE empresa_id = {eid} AND nombre <> 'ADMIN')
        OR (SELECT COUNT(*) FROM usuario WHERE empresa_id = {eid}) <> 1
        OR EXISTS (SELECT 1 FROM movimiento_caja WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM apertura_caja WHERE empresa_id = {eid} AND estado = 'CERRADA') THEN
        RAISE EXCEPTION 'La empresa {eid} ya tiene datos; la carga solo es para una empresa recién registrada';
    END IF;
END $$;
DELETE FROM apertura_caja WHERE empresa_id = {eid} AND estado = 'ABIERTA';
"""


def sql_estructura(eid, inicio, capital):
    creado = datetime.combine(inicio - timedelta(days=7), time(18, 30))
    sql = [f"""INSERT INTO forma_pago (created_at, updated_at, active, empresa_id, nombre, tipo)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE, {eid}, 'Crédito', 'CREDITO'
WHERE NOT EXISTS (SELECT 1 FROM forma_pago WHERE empresa_id = {eid} AND tipo = 'CREDITO');
INSERT INTO caja (created_at, updated_at, active, empresa_id, nombre, saldo_inicial, saldo_actual)
VALUES ({fecha_hora(creado)}, {fecha_hora(creado)}, TRUE, {eid}, 'Caja 2', {dinero(capital['Caja 2'])}, 0);
UPDATE caja SET saldo_inicial = {dinero(capital[CAJA_PRINCIPAL])} WHERE empresa_id = {eid} AND nombre = 'Caja Principal';
"""]
    categorias = [[fecha_hora(creado), str(eid), txt(nombre), txt(icono)] for _, nombre, icono in CATEGORIAS]
    sql.append(en_lotes(
        "INSERT INTO categoria_producto (created_at, updated_at, active, empresa_id, nombre, icono) "
        "SELECT v.creado, v.creado, TRUE, v.empresa, v.nombre, v.icono FROM (VALUES",
        categorias,
        ") AS v(creado, empresa, nombre, icono)",
    ))
    proveedores = [
        [fecha_hora(creado), str(eid), txt(nombre), txt(documento), txt(telefono), txt(email), txt(direccion)]
        for _, nombre, documento, telefono, email, direccion in PROVEEDORES
    ]
    sql.append(en_lotes(
        "INSERT INTO proveedor (created_at, updated_at, active, empresa_id, nombre, documento, telefono, email, "
        "direccion) SELECT v.creado, v.creado, TRUE, v.empresa, v.nombre, v.documento, v.telefono, v.email, "
        "v.direccion FROM (VALUES",
        proveedores,
        ") AS v(creado, empresa, nombre, documento, telefono, email, direccion)",
    ))
    productos = []
    for p in CATALOGO:
        domingo = inicio + timedelta(weeks=p.inicio - 1) - timedelta(days=1)
        productos.append([
            fecha_hora(datetime.combine(domingo, time(18, 30))), booleano(p.activo), txt(p.sku), txt(p.nombre),
            txt(p.categoria), txt(p.unidad), dinero(p.precio), dinero(p.costo), cantidad(p.stock_minimo),
        ])
    sql.append(en_lotes(
        f"INSERT INTO producto (created_at, updated_at, active, empresa_id, categoria_id, sku, nombre, "
        f"unidad_medida, precio_venta, costo, stock_minimo) "
        f"SELECT v.creado, v.creado, v.activo, {eid}, c.id, v.sku, v.nombre, v.unidad, v.precio, v.costo, v.minimo "
        f"FROM (VALUES",
        productos,
        f") AS v(creado, activo, sku, nombre, categoria, unidad, precio, costo, minimo) "
        f"JOIN categoria_producto c ON c.empresa_id = {eid} AND c.nombre = v.categoria",
    ))
    clientes = [
        [fecha_hora(creado), str(eid), txt(nombre), txt(documento), txt(telefono)]
        for nombre, documento, telefono in CLIENTES
    ]
    sql.append(en_lotes(
        "INSERT INTO cliente (created_at, updated_at, active, empresa_id, nombre, documento, telefono) "
        "SELECT v.creado, v.creado, TRUE, v.empresa, v.nombre, v.documento, v.telefono FROM (VALUES",
        clientes,
        ") AS v(creado, empresa, nombre, documento, telefono)",
    ))
    return "".join(sql)


def sql_inventario(eid, res, inicio):
    filas = []
    for p in CATALOGO:
        domingo = inicio + timedelta(weeks=p.inicio - 1) - timedelta(days=1)
        filas.append([
            fecha_hora(datetime.combine(domingo, time(18, 30))), booleano(p.activo), txt(p.sku),
            cantidad(res.stock_final[p.sku]), dinero(res.costo_promedio[p.sku]),
        ])
    return en_lotes(
        f"INSERT INTO inventario (created_at, updated_at, active, empresa_id, producto_id, cantidad_actual, "
        f"costo_promedio) SELECT v.creado, v.creado, v.activo, {eid}, p.id, v.cantidad, v.costo FROM (VALUES",
        filas,
        f") AS v(creado, activo, sku, cantidad, costo) JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku",
    )


def asignar_cajero(inicio, dia, caja):
    indice_caja = [c for c, _ in CAJAS].index(caja)
    return CAJEROS[((dia - inicio).days + indice_caja) % len(CAJEROS)]


def sql_usuarios(eid, inicio):
    creado = fecha_hora(datetime.combine(inicio - timedelta(days=7), time(18, 30)))
    roles = [[txt(nombre), txt(descripcion)] for nombre, descripcion, _ in ROLES]
    modulos = [[txt(nombre), txt(modulo)] for nombre, _, lista in ROLES for modulo in lista]
    usuarios = [[txt(username), txt(email)] for username, email, _ in USUARIOS]
    asignaciones = [[txt(username), txt(rol)] for username, _, rol in USUARIOS]
    return "".join([
        en_lotes(
            f"INSERT INTO rol (created_at, updated_at, active, empresa_id, nombre, descripcion) "
            f"SELECT {creado}, {creado}, TRUE, {eid}, v.nombre, v.descripcion FROM (VALUES",
            roles,
            ") AS v(nombre, descripcion)",
        ),
        en_lotes(
            f"INSERT INTO rol_modulos (rol_id, modulo) SELECT r.id, v.modulo FROM (VALUES",
            modulos,
            f") AS v(rol, modulo) JOIN rol r ON r.empresa_id = {eid} AND r.nombre = v.rol",
        ),
        en_lotes(
            f"INSERT INTO usuario (created_at, updated_at, active, empresa_id, username, email, password_hash) "
            f"SELECT {creado}, {creado}, TRUE, {eid}, v.username, v.email, {txt(HASH_CLAVE_INICIAL)} FROM (VALUES",
            usuarios,
            ") AS v(username, email)",
        ),
        en_lotes(
            "INSERT INTO usuario_rol (usuario_id, rol_id) SELECT u.id, r.id FROM (VALUES",
            asignaciones,
            f") AS v(username, rol) JOIN usuario u ON u.empresa_id = {eid} AND u.username = v.username "
            f"JOIN rol r ON r.empresa_id = {eid} AND r.nombre = v.rol",
        ),
    ])


def sql_aperturas(eid, res):
    inicio = min(a.dia for a in res.aperturas)
    aperturas = [
        [txt(a.caja), fecha_hora(a.apertura), fecha_hora(a.cierre), dinero(a.inicial), dinero(a.esperado),
         dinero(a.contado), dinero(a.diferencia), txt(asignar_cajero(inicio, a.dia, a.caja))]
        for a in res.aperturas
    ]
    return en_lotes(
        f"INSERT INTO apertura_caja (created_at, updated_at, active, empresa_id, caja_id, estado, "
        f"usuario_apertura_id, fecha_apertura, efectivo_inicial, usuario_cierre_id, fecha_cierre, "
        f"efectivo_esperado, efectivo_contado, diferencia, tipo_cierre) "
        f"SELECT v.apertura, v.cierre, TRUE, {eid}, ca.id, 'CERRADA', u.id, v.apertura, v.inicial, u.id, "
        f"v.cierre, v.esperado, v.contado, v.diferencia, 'MANUAL' FROM (VALUES",
        aperturas,
        f") AS v(caja, apertura, cierre, inicial, esperado, contado, diferencia, cajero) "
        f"JOIN caja ca ON ca.empresa_id = {eid} AND ca.nombre = v.caja "
        f"JOIN usuario u ON u.empresa_id = {eid} AND u.username = v.cajero",
    )


def sql_ventas(eid, res):
    facturas = [
        [fecha_hora(f.fecha), txt(f.numero), txt(f.forma), txt(f.documento), dinero(f.subtotal),
         dinero(f.descuento), dinero(f.total)]
        for f in res.facturas
    ]
    detalles = [
        [txt(f.numero), txt(l.sku), txt(l.descripcion), cantidad(l.cantidad), dinero(l.precio), dinero(l.total)]
        for f in res.facturas for l in f.lineas
    ]
    contado = [[txt(f.numero), txt(f.caja)] for f in res.facturas if f.forma != "CREDITO"]
    credito = [
        [txt(c.numero), dinero(c.saldo), txt(c.estado), fecha_hora(c.actualizado)] for c in res.cuentas.values()
    ]
    sql = [
        en_lotes(
            f"INSERT INTO factura_venta (created_at, updated_at, active, empresa_id, cliente_id, forma_pago_id, "
            f"numero, fecha_emision, estado, subtotal, descuento, total_impuestos, total) "
            f"SELECT v.fecha, v.fecha, TRUE, {eid}, c.id, fp.id, v.numero, v.fecha, 'EMITIDA', v.subtotal, "
            f"v.descuento, 0, v.total FROM (VALUES",
            facturas,
            f") AS v(fecha, numero, forma, documento, subtotal, descuento, total) "
            f"JOIN forma_pago fp ON fp.empresa_id = {eid} AND fp.tipo = v.forma AND fp.active "
            f"LEFT JOIN cliente c ON c.empresa_id = {eid} AND c.documento = v.documento",
        ),
        "CREATE INDEX tmp_carga_factura_numero ON factura_venta (empresa_id, numero);\nANALYZE factura_venta;\n",
        en_lotes(
            "INSERT INTO detalle_factura (created_at, updated_at, active, factura_venta_id, producto_id, "
            "descripcion, cantidad, precio_unitario, total_linea) "
            "SELECT f.fecha_emision, f.fecha_emision, TRUE, f.id, p.id, v.descripcion, v.cantidad, v.precio, v.total "
            "FROM (VALUES",
            detalles,
            f") AS v(numero, sku, descripcion, cantidad, precio, total) "
            f"JOIN factura_venta f ON f.empresa_id = {eid} AND f.numero = v.numero "
            f"JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku",
        ),
        en_lotes(
            f"INSERT INTO movimiento_caja (created_at, updated_at, active, empresa_id, caja_id, forma_pago_id, "
            f"apertura_id, fecha, tipo, monto, descripcion, tipo_referencia, referencia_id) "
            f"SELECT f.fecha_emision, f.fecha_emision, TRUE, {eid}, ca.id, f.forma_pago_id, a.id, f.fecha_emision, "
            f"'INGRESO', f.total, 'Venta factura #' || f.numero, 'FACTURA_VENTA', f.id FROM (VALUES",
            contado,
            f") AS v(numero, caja) "
            f"JOIN factura_venta f ON f.empresa_id = {eid} AND f.numero = v.numero "
            f"JOIN caja ca ON ca.empresa_id = {eid} AND ca.nombre = v.caja "
            f"JOIN apertura_caja a ON a.caja_id = ca.id AND a.estado = 'CERRADA' "
            f"AND a.fecha_apertura::date = f.fecha_emision::date",
        ),
        en_lotes(
            f"INSERT INTO cuenta_por_cobrar (created_at, updated_at, active, empresa_id, factura_venta_id, "
            f"cliente_id, monto_original, saldo, fecha_vencimiento, estado) "
            f"SELECT f.fecha_emision, v.actualizado, TRUE, {eid}, f.id, f.cliente_id, f.total, v.saldo, "
            f"f.fecha_emision + INTERVAL '30 days', v.estado FROM (VALUES",
            credito,
            f") AS v(numero, saldo, estado, actualizado) JOIN factura_venta f ON f.empresa_id = {eid} AND f.numero = v.numero",
        ),
        f"UPDATE factura_venta f SET estado = 'PAGADA' FROM cuenta_por_cobrar c "
        f"WHERE c.factura_venta_id = f.id AND c.saldo = 0 AND f.empresa_id = {eid};\n",
        "DROP INDEX tmp_carga_factura_numero;\n",
    ]
    return "".join(sql)


def sql_compras(eid, res):
    compras = [
        [fecha_hora(c.fecha), txt(c.numero), txt(NOMBRE_PROVEEDOR[c.proveedor]), txt(c.forma), dinero(c.total)]
        for c in res.compras
    ]
    detalles = [
        [txt(c.numero), txt(l.sku), txt(l.descripcion), cantidad(l.cantidad), dinero(l.costo), dinero(l.total)]
        for c in res.compras for l in c.lineas
    ]
    egresos = [[txt(c.numero), txt(c.caja)] for c in res.compras]
    return "".join([
        en_lotes(
            f"INSERT INTO compra (created_at, updated_at, active, empresa_id, proveedor_id, forma_pago_id, "
            f"numero_documento, fecha_compra, estado, subtotal, total_impuestos, total) "
            f"SELECT v.fecha, v.fecha, TRUE, {eid}, pr.id, fp.id, v.numero, v.fecha, 'REGISTRADA', v.total, 0, "
            f"v.total FROM (VALUES",
            compras,
            f") AS v(fecha, numero, proveedor, forma, total) "
            f"JOIN proveedor pr ON pr.empresa_id = {eid} AND pr.nombre = v.proveedor "
            f"JOIN forma_pago fp ON fp.empresa_id = {eid} AND fp.tipo = v.forma AND fp.active",
        ),
        "CREATE INDEX tmp_carga_compra_numero ON compra (empresa_id, numero_documento);\nANALYZE compra;\n",
        en_lotes(
            "INSERT INTO detalle_compra (created_at, updated_at, active, compra_id, producto_id, descripcion, "
            "cantidad, costo_unitario, total_linea) "
            "SELECT c.fecha_compra, c.fecha_compra, TRUE, c.id, p.id, v.descripcion, v.cantidad, v.costo, v.total "
            "FROM (VALUES",
            detalles,
            f") AS v(numero, sku, descripcion, cantidad, costo, total) "
            f"JOIN compra c ON c.empresa_id = {eid} AND c.numero_documento = v.numero "
            f"JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku",
        ),
        en_lotes(
            f"INSERT INTO movimiento_caja (created_at, updated_at, active, empresa_id, caja_id, forma_pago_id, "
            f"apertura_id, fecha, tipo, monto, descripcion, tipo_referencia, referencia_id) "
            f"SELECT c.fecha_compra, c.fecha_compra, TRUE, {eid}, ca.id, c.forma_pago_id, a.id, c.fecha_compra, "
            f"'EGRESO', c.total, 'Compra #' || c.numero_documento, 'COMPRA', c.id FROM (VALUES",
            egresos,
            f") AS v(numero, caja) "
            f"JOIN compra c ON c.empresa_id = {eid} AND c.numero_documento = v.numero "
            f"JOIN caja ca ON ca.empresa_id = {eid} AND ca.nombre = v.caja "
            f"JOIN apertura_caja a ON a.caja_id = ca.id AND a.estado = 'CERRADA' "
            f"AND a.fecha_apertura::date = c.fecha_compra::date",
        ),
        "DROP INDEX tmp_carga_compra_numero;\n",
    ])


def sql_movimientos(eid, res):
    filas = [
        [txt(m.caja), txt(m.forma), fecha_hora(m.fecha), txt(m.tipo), dinero(m.monto), txt(m.descripcion),
         txt(m.referencia)]
        for m in sorted(res.movimientos, key=lambda m: m.fecha)
    ]
    return en_lotes(
        f"INSERT INTO movimiento_caja (created_at, updated_at, active, empresa_id, caja_id, forma_pago_id, "
        f"apertura_id, fecha, tipo, monto, descripcion, tipo_referencia, referencia_id) "
        f"SELECT v.fecha, v.fecha, TRUE, {eid}, ca.id, fp.id, a.id, v.fecha, v.tipo, v.monto, v.descripcion, "
        f"v.referencia, NULL::bigint FROM (VALUES",
        filas,
        f") AS v(caja, forma, fecha, tipo, monto, descripcion, referencia) "
        f"JOIN caja ca ON ca.empresa_id = {eid} AND ca.nombre = v.caja "
        f"JOIN forma_pago fp ON fp.empresa_id = {eid} AND fp.tipo = v.forma AND fp.active "
        f"JOIN apertura_caja a ON a.caja_id = ca.id AND a.estado = 'CERRADA' "
        f"AND a.fecha_apertura::date = v.fecha::date",
    )


def sql_saldos(eid):
    return f"""UPDATE caja
SET saldo_actual = saldo_inicial + COALESCE((
        SELECT SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE -monto END)
        FROM movimiento_caja WHERE empresa_id = {eid} AND caja_id = caja.id), 0),
    updated_at = CURRENT_TIMESTAMP
WHERE empresa_id = {eid};
"""


def sql_stock(eid, res, inicio):
    ajustes = [
        [txt(a.sku), txt(a.tipo), cantidad(a.anterior), cantidad(a.nueva), txt(a.motivo), fecha_hora(a.fecha)]
        for a in res.ajustes
    ]
    fotos = [
        [txt(sku), solo_fecha(inicio + timedelta(weeks=numero - 1)), cantidad(valor)]
        for (sku, numero), valor in sorted(res.stock_lunes.items(), key=lambda item: (item[0][1], item[0][0]))
    ]
    usuario = f"(SELECT id FROM usuario WHERE empresa_id = {eid} AND username = {txt(BODEGUERO)})"
    return en_lotes(
        f"INSERT INTO movimiento_inventario (empresa_id, producto_id, usuario_id, tipo, cantidad_anterior, "
        f"cantidad_nueva, diferencia, motivo, active, created_at, updated_at) "
        f"SELECT {eid}, p.id, u.id, v.tipo, v.anterior, v.nueva, v.nueva - v.anterior, v.motivo, TRUE, v.fecha, "
        f"v.fecha FROM (VALUES",
        ajustes,
        f") AS v(sku, tipo, anterior, nueva, motivo, fecha) "
        f"JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku "
        f"CROSS JOIN {usuario} u(id)",
    ) + en_lotes(
        f"INSERT INTO inventario_semanal (empresa_id, producto_id, semana_inicio, cantidad, active, created_at, "
        f"updated_at) SELECT {eid}, p.id, v.semana, v.cantidad, TRUE, v.semana + TIME '00:05', "
        f"v.semana + TIME '00:05' FROM (VALUES",
        fotos,
        f") AS v(sku, semana, cantidad) JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku",
    )


def sql_resumen(eid):
    return f"""SELECT 'categorias' AS tabla, COUNT(*) AS filas FROM categoria_producto WHERE empresa_id = {eid}
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuario WHERE empresa_id = {eid}
UNION ALL SELECT 'roles', COUNT(*) FROM rol WHERE empresa_id = {eid}
UNION ALL SELECT 'rol_modulos', COUNT(*) FROM rol_modulos m JOIN rol r ON r.id = m.rol_id WHERE r.empresa_id = {eid}
UNION ALL SELECT 'proveedores', COUNT(*) FROM proveedor WHERE empresa_id = {eid}
UNION ALL SELECT 'productos', COUNT(*) FROM producto WHERE empresa_id = {eid}
UNION ALL SELECT 'inventarios', COUNT(*) FROM inventario WHERE empresa_id = {eid}
UNION ALL SELECT 'clientes', COUNT(*) FROM cliente WHERE empresa_id = {eid}
UNION ALL SELECT 'cajas', COUNT(*) FROM caja WHERE empresa_id = {eid} AND active
UNION ALL SELECT 'aperturas_cerradas', COUNT(*) FROM apertura_caja WHERE empresa_id = {eid} AND estado = 'CERRADA'
UNION ALL SELECT 'aperturas_abiertas', COUNT(*) FROM apertura_caja WHERE empresa_id = {eid} AND estado = 'ABIERTA'
UNION ALL SELECT 'facturas', COUNT(*) FROM factura_venta WHERE empresa_id = {eid}
UNION ALL SELECT 'detalles', COUNT(*) FROM detalle_factura d JOIN factura_venta f ON f.id = d.factura_venta_id
    WHERE f.empresa_id = {eid}
UNION ALL SELECT 'movimientos_caja', COUNT(*) FROM movimiento_caja WHERE empresa_id = {eid}
UNION ALL SELECT 'cuentas_por_cobrar', COUNT(*) FROM cuenta_por_cobrar WHERE empresa_id = {eid}
UNION ALL SELECT 'compras', COUNT(*) FROM compra WHERE empresa_id = {eid}
UNION ALL SELECT 'detalles_compra', COUNT(*) FROM detalle_compra d JOIN compra c ON c.id = d.compra_id
    WHERE c.empresa_id = {eid}
UNION ALL SELECT 'ajustes_inventario', COUNT(*) FROM movimiento_inventario WHERE empresa_id = {eid}
UNION ALL SELECT 'fotos_semanales', COUNT(*) FROM inventario_semanal WHERE empresa_id = {eid};
"""


def construir_sql(eid, correo, res, inicio):
    return "\n".join([
        "\\set ON_ERROR_STOP on",
        "BEGIN;",
        sql_guardas(eid, correo),
        sql_estructura(eid, inicio, res.capital),
        sql_usuarios(eid, inicio),
        sql_inventario(eid, res, inicio),
        sql_aperturas(eid, res),
        sql_ventas(eid, res),
        sql_compras(eid, res),
        sql_movimientos(eid, res),
        sql_saldos(eid),
        sql_stock(eid, res, inicio),
        "COMMIT;",
        sql_resumen(eid),
    ])


def saldos_finales(res):
    finales = {}
    for caja, lista in eventos_saldo(res).items():
        finales[caja] = res.capital[caja] + sum((monto for _, monto in lista), Decimal(0))
    return finales


def escribir_csv(ruta, encabezado, filas):
    with ruta.open("w", newline="", encoding="utf-8") as archivo:
        escritor = csv.writer(archivo)
        escritor.writerow(encabezado)
        escritor.writerows(filas)


def escribir_referencias(salida, res, inicio):
    ventas = []
    for p in CATALOGO:
        for numero in range(p.inicio, SEMANAS + 1):
            lunes = inicio + timedelta(weeks=numero - 1)
            ventas.append([p.sku, lunes.isoformat(), f"{res.ventas.get((p.sku, numero), Decimal(0)):.3f}"])
    escribir_csv(salida / "ventas_semanales.csv", ["sku", "semana_inicio", "unidades"], ventas)
    stock = [
        [sku, (inicio + timedelta(weeks=numero - 1)).isoformat(), f"{valor:.3f}"]
        for (sku, numero), valor in sorted(res.stock_lunes.items(), key=lambda item: (item[0][1], item[0][0]))
    ]
    escribir_csv(salida / "stock_lunes.csv", ["sku", "semana_inicio", "cantidad"], stock)
    escribir_csv(
        salida / "costo_promedio.csv", ["sku", "costo_promedio"],
        [[p.sku, f"{res.costo_promedio[p.sku]:.2f}"] for p in CATALOGO],
    )
    escribir_csv(
        salida / "cuentas_por_cobrar.csv", ["numero_factura", "documento", "fecha", "original", "saldo", "estado"],
        [[c.numero, c.documento, c.fecha.isoformat(), f"{c.original:.2f}", f"{c.saldo:.2f}", c.estado]
         for c in res.cuentas.values()],
    )
    finales = saldos_finales(res)
    escribir_csv(
        salida / "saldos_cajas.csv", ["caja", "saldo_inicial", "saldo_final"],
        [[caja, f"{res.capital[caja]:.2f}", f"{finales[caja]:.2f}"] for caja, _ in CAJAS],
    )


def contar_esperado(res):
    return {
        "usuarios": len(USUARIOS) + 1,
        "roles": len(ROLES) + 1,
        "rol_modulos": sum(len(lista) for _, _, lista in ROLES),
        "categorias": len(CATEGORIAS),
        "proveedores": len(PROVEEDORES),
        "productos": len(CATALOGO),
        "inventarios": len(CATALOGO),
        "clientes": len(CLIENTES),
        "cajas": len(CAJAS),
        "aperturas_cerradas": len(res.aperturas),
        "aperturas_abiertas": 0,
        "facturas": len(res.facturas),
        "detalles": sum(len(f.lineas) for f in res.facturas),
        "movimientos_caja": sum(1 for f in res.facturas if f.forma != "CREDITO") + len(res.compras) + len(res.movimientos),
        "cuentas_por_cobrar": len(res.cuentas),
        "compras": len(res.compras),
        "detalles_compra": sum(len(c.lineas) for c in res.compras),
        "ajustes_inventario": len(res.ajustes),
        "fotos_semanales": len(res.stock_lunes),
    }


def porcentaje_gastos(res):
    ventas_total = sum((f.total for f in res.facturas), Decimal(0))
    gastos = sum((m.monto for m in res.movimientos if m.referencia == "GASTO"), Decimal(0))
    return gastos, float(gastos / ventas_total * 100)


def imprimir_resumen(res, inicio, salida):
    fin = inicio + timedelta(days=SEMANAS * 7 - 1)
    print(f"Periodo simulado: {inicio} a {fin} ({SEMANAS} semanas)")
    print("Filas esperadas en la base:")
    for tabla, filas in contar_esperado(res).items():
        print(f"  {tabla:<20}{filas:>7}")
    ventas_total = sum((f.total for f in res.facturas), Decimal(0))
    costo_total = sum((l.cantidad * POR_SKU[l.sku].costo for f in res.facturas for l in f.lineas), Decimal(0))
    bruto = sum((l.total for f in res.facturas for l in f.lineas), Decimal(0))
    print(f"Ventas totales: {ventas_total:,.2f}")
    print(f"Margen bruto sobre el subtotal: {(bruto - costo_total) / bruto * 100:.1f} %")
    gastos, pct = porcentaje_gastos(res)
    print(f"Gastos: {gastos:,.2f} ({pct:.1f} % de las ventas)")
    if not GASTOS_MIN_PCT <= pct <= GASTOS_MAX_PCT:
        print(f"ADVERTENCIA: los gastos están fuera de {GASTOS_MIN_PCT:.0f} a {GASTOS_MAX_PCT:.0f} % de las ventas")
    compras_total = sum((c.total for c in res.compras), Decimal(0))
    print(f"Compras: {len(res.compras)} por {compras_total:,.2f}")
    abonos = sum((m.monto for m in res.movimientos if m.referencia == "CUENTA_POR_COBRAR"), Decimal(0))
    por_cobrar = sum((c.saldo for c in res.cuentas.values()), Decimal(0))
    estados = defaultdict(int)
    for c in res.cuentas.values():
        estados[c.estado] += 1
    print(f"Abonos: {abonos:,.2f}; saldo por cobrar: {por_cobrar:,.2f}; cuentas: {dict(sorted(estados.items()))}")
    print(f"Usuarios: {len(USUARIOS)} además del admin; cajeros {len(CAJEROS)} rotando entre {len(CAJAS)} cajas")
    finales = saldos_finales(res)
    for caja, _ in CAJAS:
        print(f"{caja}: capital inicial {res.capital[caja]:,.2f}, saldo final {finales[caja]:,.2f}")
    conteo = facturas_por_dia(res)
    print(f"Facturas por día: mínimo {min(conteo.values())}, promedio {sum(conteo.values()) / len(conteo):.1f}, "
          f"máximo {max(conteo.values())}")
    por_forma = defaultdict(int)
    por_caja = defaultdict(int)
    for f in res.facturas:
        por_forma[f.forma] += 1
        por_caja[f.caja] += 1
    print("Facturas por forma de pago:", dict(sorted(por_forma.items())))
    print("Facturas por caja:", dict(sorted(por_caja.items())))
    bajos = sum(1 for p in CATALOGO if p.activo and 0 < res.stock_final[p.sku] < p.stock_minimo)
    agotados = sum(1 for p in CATALOGO if p.activo and res.stock_final[p.sku] == 0)
    print(f"Stock al cierre: {bajos} bajos, {agotados} agotados")
    print("Validaciones internas: OK")
    print(f"Archivos escritos en {salida}")


def ultimo_domingo(hoy):
    return hoy - timedelta(days=hoy.weekday() + 1)


def leer_argumentos():
    parser = argparse.ArgumentParser(description="Genera la carga SQL de un supermercado simulado de 52 semanas")
    parser.add_argument("--empresa-id", type=int, required=True)
    parser.add_argument("--correo-admin", required=True)
    parser.add_argument("--fin", type=date.fromisoformat)
    parser.add_argument("--semilla", type=int, default=20261101)
    parser.add_argument("--fuerza-quincena", type=float, default=1.0)
    parser.add_argument("--salida", type=Path, default=Path("salida_supermercado"))
    return parser.parse_args()


def principal():
    args = leer_argumentos()
    fin = args.fin or ultimo_domingo(date.today())
    if fin.weekday() != 6:
        raise SystemExit("--fin debe ser un domingo")
    inicio = fin - timedelta(days=SEMANAS * 7 - 1)
    if args.fuerza_quincena <= 0:
        raise SystemExit("--fuerza-quincena debe ser mayor que 0")
    if args.fuerza_quincena != 1.0:
        escalar_quincena(args.fuerza_quincena)
    resultado = simular(random.Random(args.semilla), random.Random(args.semilla + 1), inicio)
    validar(resultado)
    args.salida.mkdir(parents=True, exist_ok=True)
    sql = construir_sql(args.empresa_id, args.correo_admin, resultado, inicio)
    (args.salida / "supermercado.sql").write_text(sql, encoding="utf-8")
    escribir_referencias(args.salida, resultado, inicio)
    imprimir_resumen(resultado, inicio, args.salida)


if __name__ == "__main__":
    principal()
