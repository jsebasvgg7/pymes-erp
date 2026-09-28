import type { FlujoCajaDiario, MovimientoCajaResponse } from "./cajaService";

export type Periodo = "semanal" | "mensual" | "anual";

export type FlujoCajaPunto = {
	label: string;
	ingreso: number;
	egreso: number;
};

export type FlujoCajaResultado = {
	puntos: FlujoCajaPunto[];
	flujoNeto: number;
};

export type CategoriaVenta = {
	categoria: string;
	total: number;
};

const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function claveSemana(fecha: Date): string {
	const inicio = new Date(fecha);
	const dia = (inicio.getDay() + 6) % 7;
	inicio.setDate(inicio.getDate() - dia);
	inicio.setHours(0, 0, 0, 0);
	return inicio.toISOString().slice(0, 10);
}

function etiquetaSemana(clave: string): string {
	const fecha = new Date(clave + "T00:00:00");
	return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

function claveMes(fecha: Date): string {
	return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(clave: string): string {
	const [, mes] = clave.split("-");
	return MESES_CORTOS[Number(mes) - 1];
}

function claveAnio(fecha: Date): string {
	return String(fecha.getFullYear());
}

/**
 * Agrupa movimientos de caja reales (INGRESO/EGRESO) por período,
 * ordenados cronológicamente. No inventa datos: si no hay movimientos
 * en un período, ese período no aparece.
 */
// Genera las últimas N claves de mes/semana terminando en hoy, para que el
// eje muestre siempre el rango completo (como JAN..DEC en el mockup) en vez
// de una sola barra ocupando todo el ancho cuando hay pocos movimientos.
function ultimasClavesMes(cantidad: number): string[] {
	const claves: string[] = [];
	const cursor = new Date();
	cursor.setDate(1);
	for (let i = 0; i < cantidad; i++) {
		claves.unshift(claveMes(cursor));
		cursor.setMonth(cursor.getMonth() - 1);
	}
	return claves;
}

function ultimasClavesSemana(cantidad: number): string[] {
	const claves: string[] = [];
	const cursor = new Date();
	for (let i = 0; i < cantidad; i++) {
		claves.unshift(claveSemana(cursor));
		cursor.setDate(cursor.getDate() - 7);
	}
	return claves;
}

export function calcularFlujoCaja(
	puntosDiarios: FlujoCajaDiario[],
	periodo: Periodo
): FlujoCajaResultado {
	const claveFn = periodo === "semanal" ? claveSemana : periodo === "mensual" ? claveMes : claveAnio;
	const etiquetaFn = periodo === "semanal" ? etiquetaSemana : periodo === "mensual" ? etiquetaMes : (c: string) => c;

	const grupos = new Map<string, { ingreso: number; egreso: number }>();

	for (const punto of puntosDiarios) {
		const fecha = new Date(punto.fecha + "T00:00:00");
		if (Number.isNaN(fecha.getTime())) continue;

		const clave = claveFn(fecha);
		const actual = grupos.get(clave) ?? { ingreso: 0, egreso: 0 };
		actual.ingreso += punto.ingreso;
		actual.egreso += punto.egreso;
		grupos.set(clave, actual);
	}

	// Para semanal/mensual, siempre se muestra el rango completo (últimos 12
	// puntos) aunque algunos queden en cero, para que el eje tenga la misma
	// densidad que el mockup. Para anual se muestran solo los años con datos
	// reales, ya que no hay un rango "natural" fijo que rellenar.
	const claves =
		periodo === "mensual"
			? ultimasClavesMes(12)
			: periodo === "semanal"
				? ultimasClavesSemana(12)
				: [...grupos.keys()].sort();

	const puntos: FlujoCajaPunto[] = claves.map((clave) => {
		const { ingreso, egreso } = grupos.get(clave) ?? { ingreso: 0, egreso: 0 };
		return { label: etiquetaFn(clave), ingreso, egreso };
	});

	const flujoNeto = puntosDiarios.reduce(
		(acc, p) => acc + (p.ingreso - p.egreso),
		0
	);

	return { puntos, flujoNeto };
}

export function totalVentasPorCategoria(items: CategoriaVenta[]): number {
	return items.reduce((acc, item) => acc + item.total, 0);
}

/**
 * Promedio de ventas entre todas las categorías del rango actual. Sirve
 * como referencia comparativa (zona gris) contra el total real de cada
 * categoría (zona negra), sin pedir un período histórico aparte al backend.
 */
export function promedioVentasPorCategoria(items: CategoriaVenta[]): number {
	if (items.length === 0) return 0;
	return totalVentasPorCategoria(items) / items.length;
}

/**
 * Cuenta cuántos ítems (clientes o productos) fueron creados ayer,
 * usando el campo real createdAt que ya expone el backend. Es la misma
 * base de datos que soporta la variación de caja: comparación real,
 * sin inventar un histórico agregado que el backend no tiene.
 */
export function calcularRegistradosAyer(items: { createdAt: string }[]): number {
	const ahora = new Date();
	const ayer = new Date(ahora);
	ayer.setDate(ayer.getDate() - 1);
	const ayerYMD = ayer.toDateString();

	return items.reduce((acc, item) => {
		const fecha = new Date(item.createdAt);
		if (Number.isNaN(fecha.getTime())) return acc;
		return fecha.toDateString() === ayerYMD ? acc + 1 : acc;
	}, 0);
}

/**
 * Neto de caja (ingresos - egresos) del día calendario actual, calculado
 * a partir de movimientos reales con fecha.
 */
export function calcularNetoCajaHoy(movimientos: MovimientoCajaResponse[]): number {
	const hoy = new Date();
	const hoyYMD = hoy.toDateString();

	return movimientos.reduce((acc, m) => {
		const fecha = new Date(m.fecha);
		if (fecha.toDateString() !== hoyYMD) return acc;
		return acc + (m.tipo === "INGRESO" ? m.monto : -m.monto);
	}, 0);
}