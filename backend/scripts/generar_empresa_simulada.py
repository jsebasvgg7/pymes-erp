import argparse
import csv
import math
import random
from collections import defaultdict
from dataclasses import dataclass, field, replace
from datetime import date, datetime, time, timedelta
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal
from pathlib import Path

SEMANAS = 12
CENTAVOS = Decimal("0.01")
MILESIMAS = Decimal("0.001")
UNIDADES_DECIMALES = {"KILOGRAMO", "GRAMO", "LITRO", "MILILITRO"}
PESOS_DIA = (0.88, 0.84, 0.90, 0.96, 1.18, 1.42, 0.82)
HORAS = tuple(range(7, 21))
PESOS_HORA = (3, 4, 5, 7, 9, 8, 6, 5, 5, 6, 8, 9, 6, 3)
FORMAS_PAGO = (("EFECTIVO", 0.62), ("TRANSFERENCIA", 0.18), ("TARJETA", 0.15), ("CREDITO", 0.05))
TAMANOS_CANASTA = (1, 1, 2, 2, 3, 3, 4, 5, 6)
EFECTIVO_INICIAL = (40000, 50000, 60000, 80000)
VENTA_MINIMA_CREDITO = Decimal(8000)
TAMANO_LOTE_SQL = 400

CATEGORIAS = (
    "Bebidas",
    "Lácteos y huevos",
    "Abarrotes y granos",
    "Aseo y hogar",
    "Snacks y dulces",
)

CLIENTES = (
    ("María Fernanda Pérez", "1047382910", "3157842310"),
    ("Carlos Andrés Mendoza", "1047291835", "3012456781"),
    ("Luz Marina Ortega", "45512876", "3205587123"),
    ("Jhon Jairo Castillo", "73148920", "3114459032"),
    ("Yurleidis Támara", "1143829045", "3168830275"),
    ("Edwin Barrios", "1047418392", "3009127746"),
    ("Doris Herrera", "33172845", "3126671904"),
    ("Tienda La Esperanza", "900482315", "3185520948"),
)


def lotes(*valores):
    return tuple(Decimal(str(valor)) for valor in valores)


LOTE_UNO = lotes(1, 1, 1, 2, 2, 3)
LOTE_BEBIDA = lotes(1, 1, 2, 3, 6)
LOTE_CERVEZA = lotes(1, 2, 3, 6)
LOTE_HUEVOS = lotes(2, 3, 4, 6, 6, 12, 15)
LOTE_KILO = lotes(0.5, 1, 1, 2, 2, 3, 5)
LOTE_QUESO = lotes(0.25, 0.3, 0.4, 0.5, 0.75, 1)
LOTE_LITRO = lotes(0.5, 1, 1, 1.5, 2)
LOTE_RARO = lotes(1, 1, 1, 2)


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
    lotes: tuple
    inicio: int = 1
    fin: int = SEMANAS

    @property
    def decimal(self):
        return self.unidad in UNIDADES_DECIMALES

    @property
    def lote_medio(self):
        return float(sum(self.lotes) / len(self.lotes))

    @property
    def stock_minimo(self):
        return Decimal(max(1, math.ceil(self.demanda * 0.25)))


def producto(sku, nombre, categoria, unidad, precio, costo, demanda, quincena, tendencia, lote, inicio=1, fin=SEMANAS):
    return Producto(
        sku, nombre, CATEGORIAS[categoria], unidad, Decimal(precio), Decimal(costo),
        demanda, quincena, tendencia, lote, inicio, fin,
    )


CATALOGO = (
    producto("BEB-001", "Gaseosa Cola 400 ml", 0, "UNIDAD", 2200, 1500, 140, 0.40, 0.10, LOTE_BEBIDA),
    producto("BEB-002", "Agua en Botella 600 ml", 0, "UNIDAD", 1500, 900, 120, 0.20, 0.20, LOTE_BEBIDA),
    producto("BEB-003", "Jugo de Naranja Natural", 0, "LITRO", 6500, 4200, 24, 0.30, 0.00, LOTE_LITRO),
    producto("BEB-004", "Cerveza Lata 330 ml", 0, "UNIDAD", 3200, 2400, 55, 0.90, 0.00, LOTE_CERVEZA),
    producto("BEB-005", "Café Instantáneo Sobre", 0, "UNIDAD", 800, 500, 40, 0.40, -0.10, LOTE_UNO),
    producto("LAC-001", "Leche Entera Bolsa 1 L", 1, "UNIDAD", 4200, 3500, 95, 0.40, 0.00, LOTE_UNO),
    producto("LAC-002", "Huevos AA Unidad", 1, "UNIDAD", 700, 500, 150, 0.50, 0.05, LOTE_HUEVOS),
    producto("LAC-003", "Queso Costeño", 1, "KILOGRAMO", 24000, 18000, 14, 0.50, 0.00, LOTE_QUESO),
    producto("LAC-004", "Yogurt Vaso 200 ml", 1, "UNIDAD", 2300, 1600, 30, 0.30, 0.15, LOTE_UNO),
    producto("LAC-005", "Mantequilla 250 g", 1, "UNIDAD", 5500, 4200, 6, 0.30, 0.00, LOTE_UNO),
    producto("ABA-001", "Arroz Blanco", 2, "KILOGRAMO", 4200, 3300, 85, 0.90, 0.00, LOTE_KILO),
    producto("ABA-002", "Azúcar Blanca", 2, "KILOGRAMO", 4000, 3200, 45, 0.80, 0.00, LOTE_KILO),
    producto("ABA-003", "Aceite Vegetal 1 L", 2, "UNIDAD", 11500, 9200, 26, 0.90, 0.00, LOTE_UNO),
    producto("ABA-004", "Fríjol Cabecita Negra", 2, "KILOGRAMO", 7500, 6000, 18, 0.80, 0.00, LOTE_KILO),
    producto("ABA-005", "Lentejas", 2, "KILOGRAMO", 6800, 5400, 5, 0.70, 0.00, LOTE_KILO),
    producto("ABA-006", "Pasta Espagueti 250 g", 2, "UNIDAD", 2400, 1700, 52, 0.60, 0.10, LOTE_UNO),
    producto("ABA-007", "Sal Marina 500 g", 2, "UNIDAD", 1200, 800, 22, 0.30, 0.00, LOTE_UNO),
    producto("ABA-008", "Atún Lata 160 g", 2, "UNIDAD", 4800, 3700, 12, 0.60, 0.00, LOTE_UNO, fin=7),
    producto("ABA-009", "Panela Cuadrada", 2, "UNIDAD", 2800, 2100, 28, 0.60, -0.15, LOTE_UNO),
    producto("ABA-010", "Sopa de Pollo Sobre", 2, "UNIDAD", 1800, 1200, 9, 0.50, 0.00, LOTE_UNO, fin=7),
    producto("ASE-001", "Jabón de Barra", 3, "UNIDAD", 2000, 1300, 38, 0.60, 0.00, LOTE_UNO),
    producto("ASE-002", "Detergente en Polvo 1 kg", 3, "UNIDAD", 9800, 7800, 20, 0.80, 0.10, LOTE_UNO),
    producto("ASE-003", "Papel Higiénico x4", 3, "PAQUETE", 6500, 4900, 33, 0.60, 0.00, LOTE_UNO),
    producto("ASE-004", "Cloro 1 L", 3, "UNIDAD", 3600, 2500, 16, 0.50, 0.00, LOTE_UNO),
    producto("ASE-005", "Escoba", 3, "UNIDAD", 9500, 6800, 1.5, 0.50, 0.00, LOTE_RARO),
    producto("SNA-001", "Papas Fritas Bolsa 45 g", 4, "UNIDAD", 2200, 1500, 72, 0.30, 0.25, LOTE_BEBIDA),
    producto("SNA-002", "Galletas Saladas Paquete", 4, "PAQUETE", 3200, 2400, 30, 0.30, 0.00, LOTE_UNO),
    producto("SNA-003", "Chocolatina", 4, "UNIDAD", 1800, 1200, 46, 0.30, -0.20, LOTE_UNO),
    producto("SNA-004", "Chicles Caja x20", 4, "CAJA", 14000, 10500, 2.0, 0.30, 0.00, LOTE_RARO),
    producto("SNA-005", "Helado de Paleta", 4, "UNIDAD", 2500, 1700, 35, 0.20, 0.00, LOTE_UNO, inicio=8),
)

POR_SKU = {p.sku: p for p in CATALOGO}


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
    forma: str
    documento: str
    lineas: tuple
    subtotal: Decimal
    descuento: Decimal
    total: Decimal


@dataclass(frozen=True)
class Apertura:
    dia: date
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


@dataclass
class Resultado:
    facturas: list = field(default_factory=list)
    aperturas: list = field(default_factory=list)
    ajustes: list = field(default_factory=list)
    stock_lunes: dict = field(default_factory=dict)
    ventas: dict = field(default_factory=lambda: defaultdict(Decimal))
    stock_final: dict = field(default_factory=dict)


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


def intensidad(p, nivel, dia, inicio):
    transcurrido = (dia - inicio).days
    tendencia = 1 + p.tendencia * transcurrido / (SEMANAS * 7)
    return p.demanda / 7 * PESOS_DIA[dia.weekday()] * nivel * tendencia * efecto_quincena(dia, p.quincena)


def generar_niveles(rng):
    nivel = 1.0
    niveles = []
    for _ in range(SEMANAS + 1):
        nivel = 1 + 0.7 * (nivel - 1) + rng.gauss(0, 0.08)
        niveles.append(max(0.5, nivel))
    return niveles


def objetivo_stock(rng, p, lunes, inicio, nivel):
    esperado = sum(intensidad(p, nivel, lunes + timedelta(days=i), inicio) for i in range(7))
    bruto = esperado * rng.uniform(1.3, 1.65)
    if p.decimal:
        return Decimal(math.ceil(bruto * 2)) / 2
    return Decimal(max(math.ceil(bruto), 2))


def planear_stock(rng, p, semana, lunes, inicio, nivel, stock, res):
    numero = semana + 1
    if numero < p.inicio:
        return
    if numero == p.inicio:
        objetivo = objetivo_stock(rng, p, lunes, inicio, nivel)
        fecha = datetime.combine(lunes - timedelta(days=1), time(19, 0))
        res.ajustes.append(Ajuste(p.sku, fecha, "CONTEO", Decimal(0), objetivo, "Inventario inicial"))
        stock[p.sku] = objetivo
        res.stock_lunes[(p.sku, numero)] = objetivo
        return
    res.stock_lunes[(p.sku, numero)] = stock[p.sku]
    if numero > p.fin:
        return
    objetivo = objetivo_stock(rng, p, lunes, inicio, nivel)
    if objetivo > stock[p.sku]:
        fecha = datetime.combine(lunes, time(6, rng.randrange(30, 55), rng.randrange(60)))
        res.ajustes.append(Ajuste(p.sku, fecha, "ENTRADA", stock[p.sku], objetivo, "Reposición semanal"))
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
    for p in CATALOGO:
        if not p.inicio <= semana + 1 <= p.fin:
            continue
        lam = intensidad(p, niveles[p.sku][semana], dia, inicio) * rng.lognormvariate(0, 0.10)
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


def facturar(rng, fecha, items, secuencia, documentos):
    forma = rng.choices([f for f, _ in FORMAS_PAGO], weights=[w for _, w in FORMAS_PAGO])[0]
    lineas = []
    subtotal = Decimal(0)
    for p, cantidad in items:
        total = (cantidad * p.precio).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
        lineas.append(Linea(p.sku, p.nombre, cantidad, p.precio, total))
        subtotal += total
    if forma == "CREDITO" and subtotal < VENTA_MINIMA_CREDITO:
        forma = "EFECTIVO"
    documento = None
    if forma == "CREDITO" or rng.random() < 0.12:
        documento = rng.choice(documentos)
    descuento = Decimal(0)
    if rng.random() < 0.08:
        porcentaje = Decimal(str(rng.choice((0.05, 0.10))))
        descuento = (subtotal * porcentaje).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
    numero = f"FAC-{fecha:%Y%m%d}-{secuencia:05d}"
    return Factura(numero, fecha, forma, documento, tuple(lineas), subtotal, descuento, subtotal - descuento)


def cerrar_dia(rng, dia, facturas):
    ingresos = sum((f.total for f in facturas if f.forma == "EFECTIVO"), Decimal(0))
    inicial = Decimal(rng.choice(EFECTIVO_INICIAL))
    esperado = inicial + ingresos
    sorteo = rng.random()
    if sorteo < 0.70:
        diferencia = 0
    elif sorteo < 0.85:
        diferencia = -rng.randrange(1, 11) * 500
    else:
        diferencia = rng.randrange(1, 7) * 500
    apertura = datetime.combine(dia, time(6, rng.randrange(30, 60), rng.randrange(60)))
    cierre = datetime.combine(dia, time(21, rng.randrange(0, 41), rng.randrange(60)))
    return Apertura(dia, apertura, cierre, inicial, esperado, esperado + diferencia, Decimal(diferencia))


def simular(rng, inicio):
    niveles = {p.sku: generar_niveles(rng) for p in CATALOGO}
    stock = {p.sku: Decimal(0) for p in CATALOGO}
    documentos = [cliente[1] for cliente in CLIENTES]
    res = Resultado()
    secuencia = 0
    for semana in range(SEMANAS):
        lunes = inicio + timedelta(weeks=semana)
        for p in CATALOGO:
            planear_stock(rng, p, semana, lunes, inicio, niveles[p.sku][semana], stock, res)
        for desplazamiento in range(7):
            dia = lunes + timedelta(days=desplazamiento)
            facturas_dia = []
            for fecha, items in simular_dia(rng, dia, semana, inicio, niveles, stock):
                secuencia += 1
                factura = facturar(rng, fecha, items, secuencia, documentos)
                facturas_dia.append(factura)
                for linea in factura.lineas:
                    res.ventas[(linea.sku, semana + 1)] += linea.cantidad
            res.facturas.extend(facturas_dia)
            res.aperturas.append(cerrar_dia(rng, dia, facturas_dia))
    for p in CATALOGO:
        res.stock_lunes[(p.sku, SEMANAS + 1)] = stock[p.sku]
    res.stock_final = dict(stock)
    return res


def escalar_quincena(factor):
    global CATALOGO, POR_SKU
    CATALOGO = tuple(replace(p, quincena=p.quincena * factor) for p in CATALOGO)
    POR_SKU = {p.sku: p for p in CATALOGO}


def fallar(mensaje):
    raise SystemExit(f"Validación fallida: {mensaje}")


def validar(res):
    numeros = set()
    total_lineas = Decimal(0)
    for f in res.facturas:
        if f.numero in numeros:
            fallar(f"número repetido {f.numero}")
        numeros.add(f.numero)
        if not 0 <= f.descuento <= f.subtotal or f.total != f.subtotal - f.descuento:
            fallar(f"totales inconsistentes en {f.numero}")
        for linea in f.lineas:
            p = POR_SKU[linea.sku]
            if linea.cantidad <= 0 or linea.cantidad != linea.cantidad.quantize(MILESIMAS):
                fallar(f"cantidad inválida en {f.numero}")
            if not p.decimal and linea.cantidad != linea.cantidad.to_integral_value():
                fallar(f"decimales en producto entero {p.sku}")
            total_lineas += linea.cantidad
    if any(valor < 0 for valor in res.stock_final.values()):
        fallar("stock final negativo")
    if any(valor < 0 for valor in res.stock_lunes.values()):
        fallar("foto semanal negativa")
    if sum(res.ventas.values(), Decimal(0)) != total_lineas:
        fallar("las ventas semanales no suman las líneas")
    for p in CATALOGO:
        for numero in range(1, SEMANAS + 1):
            if (numero < p.inicio or numero > p.fin) and res.ventas.get((p.sku, numero), 0) != 0:
                fallar(f"ventas fuera de la vida de {p.sku}")


def txt(valor):
    if valor is None:
        return "NULL::varchar"
    return "'" + valor.replace("'", "''") + "'::varchar"


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
    IF NOT EXISTS (SELECT 1 FROM caja WHERE empresa_id = {eid} AND active) THEN
        RAISE EXCEPTION 'La empresa {eid} no tiene caja';
    END IF;
    FOREACH tipo_forma IN ARRAY ARRAY['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] LOOP
        IF (SELECT COUNT(*) FROM forma_pago WHERE empresa_id = {eid} AND active AND tipo = tipo_forma) <> 1 THEN
            RAISE EXCEPTION 'La empresa {eid} debe tener exactamente una forma de pago %', tipo_forma;
        END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM factura_venta WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM producto WHERE empresa_id = {eid})
        OR EXISTS (SELECT 1 FROM movimiento_caja WHERE empresa_id = {eid}) THEN
        RAISE EXCEPTION 'La empresa {eid} ya tiene datos; la carga solo es para una empresa vacía';
    END IF;
END $$;
"""


def sql_catalogo(eid, inicio):
    creado = datetime.combine(inicio - timedelta(days=1), time(18, 30))
    sql = [f"""INSERT INTO forma_pago (created_at, updated_at, active, empresa_id, nombre, tipo)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE, {eid}, 'Crédito', 'CREDITO'
WHERE NOT EXISTS (SELECT 1 FROM forma_pago WHERE empresa_id = {eid} AND tipo = 'CREDITO');
"""]
    categorias = [[fecha_hora(creado), str(eid), txt(nombre)] for nombre in CATEGORIAS]
    sql.append(en_lotes(
        "INSERT INTO categoria_producto (created_at, updated_at, active, empresa_id, nombre) "
        "SELECT v.creado, v.creado, TRUE, v.empresa, v.nombre FROM (VALUES",
        categorias,
        ") AS v(creado, empresa, nombre)",
    ))
    productos = []
    for p in CATALOGO:
        domingo = inicio + timedelta(weeks=p.inicio - 1) - timedelta(days=1)
        productos.append([
            fecha_hora(datetime.combine(domingo, time(18, 30))), txt(p.sku), txt(p.nombre), txt(p.categoria),
            txt(p.unidad), dinero(p.precio), dinero(p.costo), cantidad(p.stock_minimo),
        ])
    sql.append(en_lotes(
        f"INSERT INTO producto (created_at, updated_at, active, empresa_id, categoria_id, sku, nombre, "
        f"unidad_medida, precio_venta, costo, stock_minimo) "
        f"SELECT v.creado, v.creado, TRUE, {eid}, c.id, v.sku, v.nombre, v.unidad, v.precio, v.costo, v.minimo "
        f"FROM (VALUES",
        productos,
        f") AS v(creado, sku, nombre, categoria, unidad, precio, costo, minimo) "
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
            fecha_hora(datetime.combine(domingo, time(18, 30))), txt(p.sku),
            cantidad(res.stock_final[p.sku]), dinero(p.costo),
        ])
    return en_lotes(
        f"INSERT INTO inventario (created_at, updated_at, active, empresa_id, producto_id, cantidad_actual, "
        f"costo_promedio) SELECT v.creado, v.creado, TRUE, {eid}, p.id, v.cantidad, v.costo FROM (VALUES",
        filas,
        f") AS v(creado, sku, cantidad, costo) JOIN producto p ON p.empresa_id = {eid} AND p.sku = v.sku",
    )


def sql_caja(eid, correo, res):
    caja = f"(SELECT id FROM caja WHERE empresa_id = {eid} AND active ORDER BY id LIMIT 1)"
    usuario = f"(SELECT id FROM usuario WHERE empresa_id = {eid} AND email = {txt(correo)})"
    aperturas = [
        [fecha_hora(a.apertura), fecha_hora(a.cierre), dinero(a.inicial), dinero(a.esperado),
         dinero(a.contado), dinero(a.diferencia)]
        for a in res.aperturas
    ]
    return en_lotes(
        f"INSERT INTO apertura_caja (created_at, updated_at, active, empresa_id, caja_id, estado, "
        f"usuario_apertura_id, fecha_apertura, efectivo_inicial, usuario_cierre_id, fecha_cierre, "
        f"efectivo_esperado, efectivo_contado, diferencia, tipo_cierre) "
        f"SELECT v.apertura, v.cierre, TRUE, {eid}, ca.id, 'CERRADA', u.id, v.apertura, v.inicial, u.id, "
        f"v.cierre, v.esperado, v.contado, v.diferencia, 'MANUAL' FROM (VALUES",
        aperturas,
        f") AS v(apertura, cierre, inicial, esperado, contado, diferencia) "
        f"CROSS JOIN {caja} ca(id) "
        f"CROSS JOIN {usuario} u(id)",
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
    contado = [[txt(f.numero)] for f in res.facturas if f.forma != "CREDITO"]
    credito = [[txt(f.numero)] for f in res.facturas if f.forma == "CREDITO"]
    caja = f"(SELECT id FROM caja WHERE empresa_id = {eid} AND active ORDER BY id LIMIT 1)"
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
            f") AS v(numero) "
            f"JOIN factura_venta f ON f.empresa_id = {eid} AND f.numero = v.numero "
            f"JOIN apertura_caja a ON a.empresa_id = {eid} AND a.estado = 'CERRADA' "
            f"AND a.fecha_apertura::date = f.fecha_emision::date "
            f"CROSS JOIN {caja} ca(id)",
        ),
        en_lotes(
            f"INSERT INTO cuenta_por_cobrar (created_at, updated_at, active, empresa_id, factura_venta_id, "
            f"cliente_id, monto_original, saldo, fecha_vencimiento, estado) "
            f"SELECT f.fecha_emision, f.fecha_emision, TRUE, {eid}, f.id, f.cliente_id, f.total, f.total, "
            f"f.fecha_emision + INTERVAL '30 days', 'ABIERTA' FROM (VALUES",
            credito,
            f") AS v(numero) JOIN factura_venta f ON f.empresa_id = {eid} AND f.numero = v.numero",
        ),
        f"""UPDATE caja
SET saldo_actual = saldo_actual + COALESCE((
        SELECT SUM(monto) FROM movimiento_caja
        WHERE empresa_id = {eid} AND caja_id = caja.id AND tipo_referencia = 'FACTURA_VENTA'), 0),
    updated_at = CURRENT_TIMESTAMP
WHERE id = {caja};
""",
    ]
    return "".join(sql)


def sql_stock(eid, correo, res, inicio):
    ajustes = [
        [txt(a.sku), txt(a.tipo), cantidad(a.anterior), cantidad(a.nueva), txt(a.motivo), fecha_hora(a.fecha)]
        for a in res.ajustes
    ]
    fotos = [
        [txt(sku), solo_fecha(inicio + timedelta(weeks=numero - 1)), cantidad(valor)]
        for (sku, numero), valor in sorted(res.stock_lunes.items(), key=lambda item: (item[0][1], item[0][0]))
    ]
    usuario = f"(SELECT id FROM usuario WHERE empresa_id = {eid} AND email = {txt(correo)})"
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
UNION ALL SELECT 'productos', COUNT(*) FROM producto WHERE empresa_id = {eid}
UNION ALL SELECT 'inventarios', COUNT(*) FROM inventario WHERE empresa_id = {eid}
UNION ALL SELECT 'clientes', COUNT(*) FROM cliente WHERE empresa_id = {eid}
UNION ALL SELECT 'aperturas_cerradas', COUNT(*) FROM apertura_caja WHERE empresa_id = {eid} AND estado = 'CERRADA'
UNION ALL SELECT 'facturas', COUNT(*) FROM factura_venta WHERE empresa_id = {eid}
UNION ALL SELECT 'detalles', COUNT(*) FROM detalle_factura d JOIN factura_venta f ON f.id = d.factura_venta_id
    WHERE f.empresa_id = {eid}
UNION ALL SELECT 'movimientos_caja', COUNT(*) FROM movimiento_caja WHERE empresa_id = {eid}
UNION ALL SELECT 'cuentas_por_cobrar', COUNT(*) FROM cuenta_por_cobrar WHERE empresa_id = {eid}
UNION ALL SELECT 'ajustes_inventario', COUNT(*) FROM movimiento_inventario WHERE empresa_id = {eid}
UNION ALL SELECT 'fotos_semanales', COUNT(*) FROM inventario_semanal WHERE empresa_id = {eid};
"""


def construir_sql(eid, correo, res, inicio):
    return "\n".join([
        "\\set ON_ERROR_STOP on",
        "BEGIN;",
        sql_guardas(eid, correo),
        sql_catalogo(eid, inicio),
        sql_inventario(eid, res, inicio),
        sql_caja(eid, correo, res),
        sql_ventas(eid, res),
        sql_stock(eid, correo, res, inicio),
        "COMMIT;",
        sql_resumen(eid),
    ])


def escribir_csv(ruta, encabezado, filas):
    with ruta.open("w", newline="", encoding="utf-8") as archivo:
        escritor = csv.writer(archivo)
        escritor.writerow(encabezado)
        escritor.writerows(filas)


def escribir_referencias(salida, res, inicio):
    escribir_csv(
        salida / "catalogo.csv",
        ["sku", "nombre", "categoria", "unidad", "semana_inicio", "semana_fin"],
        [[p.sku, p.nombre, p.categoria, p.unidad, p.inicio, p.fin] for p in CATALOGO],
    )
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


def contar_esperado(res):
    return {
        "categorias": len(CATEGORIAS),
        "productos": len(CATALOGO),
        "inventarios": len(CATALOGO),
        "clientes": len(CLIENTES),
        "aperturas_cerradas": len(res.aperturas),
        "facturas": len(res.facturas),
        "detalles": sum(len(f.lineas) for f in res.facturas),
        "movimientos_caja": sum(1 for f in res.facturas if f.forma != "CREDITO"),
        "cuentas_por_cobrar": sum(1 for f in res.facturas if f.forma == "CREDITO"),
        "ajustes_inventario": len(res.ajustes),
        "fotos_semanales": len(res.stock_lunes),
    }


def imprimir_resumen(res, inicio, salida):
    fin = inicio + timedelta(days=SEMANAS * 7 - 1)
    print(f"Periodo simulado: {inicio} a {fin} ({SEMANAS} semanas)")
    print("Filas esperadas en la base:")
    for tabla, filas in contar_esperado(res).items():
        print(f"  {tabla:<20}{filas:>7}")
    ventas_total = sum((f.total for f in res.facturas), Decimal(0))
    print(f"Ventas totales: {ventas_total:,.2f}")
    por_forma = defaultdict(int)
    for f in res.facturas:
        por_forma[f.forma] += 1
    print("Facturas por forma de pago:", dict(sorted(por_forma.items())))
    print("Validaciones internas: OK")
    print(f"Archivos escritos en {salida}")


def ultimo_domingo(hoy):
    return hoy - timedelta(days=hoy.weekday() + 1)


def leer_argumentos():
    parser = argparse.ArgumentParser(description="Genera la carga SQL de una empresa simulada de 12 semanas")
    parser.add_argument("--empresa-id", type=int, required=True)
    parser.add_argument("--correo-admin", default="simulacion@pymeserp.test")
    parser.add_argument("--fin", type=date.fromisoformat)
    parser.add_argument("--semilla", type=int, default=20261027)
    parser.add_argument("--fuerza-quincena", type=float, default=1.0)
    parser.add_argument("--salida", type=Path, default=Path("salida_simulacion"))
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
    resultado = simular(random.Random(args.semilla), inicio)
    validar(resultado)
    args.salida.mkdir(parents=True, exist_ok=True)
    sql = construir_sql(args.empresa_id, args.correo_admin, resultado, inicio)
    (args.salida / "empresa_simulada.sql").write_text(sql, encoding="utf-8")
    escribir_referencias(args.salida, resultado, inicio)
    imprimir_resumen(resultado, inicio, args.salida)


if __name__ == "__main__":
    principal()
