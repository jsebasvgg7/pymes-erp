import { ventaService } from "./VentaService";

export type Variacion = { direction: "up" | "down"; text: string };
export type VentasDia = { cantidad: number; total: number };
export type VentasHoyAyer = { hoy: VentasDia; ayer: VentasDia };

function ymdLocal(fecha: Date): string {
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function ymdConOffset(offsetDias: number): string {
	const fecha = new Date();
	fecha.setDate(fecha.getDate() + offsetDias);
	return ymdLocal(fecha);
}

async function ventasDelDia(empresaId: number, offsetDias: number): Promise<VentasDia> {
	const dia = ymdConOffset(offsetDias);
	const facturas = await ventaService.obtenerPorPeriodo(empresaId, `${dia}T00:00:00`, `${dia}T23:59:59`);
	const validas = facturas.filter((f) => f.estado !== "ANULADA");
	return {
		cantidad: validas.length,
		total: validas.reduce((acc, f) => acc + f.total, 0)
	};
}

export async function cargarVentasHoyAyer(empresaId: number): Promise<VentasHoyAyer> {
	const [hoy, ayer] = await Promise.all([ventasDelDia(empresaId, 0), ventasDelDia(empresaId, -1)]);
	return { hoy, ayer };
}

export function contarEnDia(fechas: string[], offsetDias: number): number {
	const dia = ymdConOffset(offsetDias);
	return fechas.reduce((acc, f) => (f && f.slice(0, 10) === dia ? acc + 1 : acc), 0);
}

export function variacionVsAyer(hoy: number, ayer: number, formato: (n: number) => string): Variacion | undefined {
	const diferencia = hoy - ayer;
	if (diferencia === 0) return undefined;
	return diferencia > 0
		? { direction: "up", text: `${formato(diferencia)} más que ayer` }
		: { direction: "down", text: `${formato(-diferencia)} menos que ayer` };
}

export function variacionNuevosHoy(cantidad: number): Variacion | undefined {
	return cantidad > 0 ? { direction: "up", text: `+${cantidad} hoy` } : undefined;
}

export function etiquetaVentas(n: number): string {
	return `${n.toLocaleString("es-CO")} ${n === 1 ? "venta" : "ventas"}`;
}

export function etiquetaCompras(n: number): string {
	return `${n.toLocaleString("es-CO")} ${n === 1 ? "compra" : "compras"}`;
}
