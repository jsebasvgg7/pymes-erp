import { useSyncExternalStore } from "react";

export type FormatoFecha = "DD/MM/AAAA" | "MM/DD/AAAA" | "AAAA-MM-DD";

export type FormatoConfig = {
	moneda: string;
	simboloMoneda: string;
	formatoFecha: FormatoFecha;
};

const FORMATOS_FECHA: FormatoFecha[] = ["DD/MM/AAAA", "MM/DD/AAAA", "AAAA-MM-DD"];
const MONEDAS_SIN_DECIMALES = new Set(["COP", "CLP", "JPY", "PYG"]);

const FORMATO_INICIAL: FormatoConfig = {
	moneda: "COP",
	simboloMoneda: "$",
	formatoFecha: "DD/MM/AAAA"
};

let estado: FormatoConfig = FORMATO_INICIAL;
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
	oyentes.add(oyente);
	return () => {
		oyentes.delete(oyente);
	};
}

function leerEstado() {
	return estado;
}

export function setFormato(parcial: Partial<FormatoConfig>) {
	const siguiente: FormatoConfig = {
		moneda: typeof parcial.moneda === "string" && parcial.moneda ? parcial.moneda : estado.moneda,
		simboloMoneda:
			typeof parcial.simboloMoneda === "string" && parcial.simboloMoneda ? parcial.simboloMoneda : estado.simboloMoneda,
		formatoFecha:
			parcial.formatoFecha && FORMATOS_FECHA.includes(parcial.formatoFecha) ? parcial.formatoFecha : estado.formatoFecha
	};
	if (
		siguiente.moneda === estado.moneda &&
		siguiente.simboloMoneda === estado.simboloMoneda &&
		siguiente.formatoFecha === estado.formatoFecha
	) {
		return;
	}
	estado = siguiente;
	oyentes.forEach((oyente) => oyente());
}

export function useFormato(): FormatoConfig {
	return useSyncExternalStore(suscribir, leerEstado);
}

export function formatCurrency(value: number): string {
	const decimales = MONEDAS_SIN_DECIMALES.has(estado.moneda) ? 0 : 2;
	const numero = Math.abs(value).toLocaleString("es-CO", {
		minimumFractionDigits: decimales,
		maximumFractionDigits: decimales
	});
	return `${value < 0 ? "-" : ""}${estado.simboloMoneda} ${numero}`;
}

function leerFecha(value: string): Date {
	return new Date(value.length <= 10 ? `${value}T00:00:00` : value);
}

function componerFecha(d: Date): string {
	const dia = String(d.getDate()).padStart(2, "0");
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const anio = String(d.getFullYear());
	if (estado.formatoFecha === "MM/DD/AAAA") return `${mes}/${dia}/${anio}`;
	if (estado.formatoFecha === "AAAA-MM-DD") return `${anio}-${mes}-${dia}`;
	return `${dia}/${mes}/${anio}`;
}

export function formatDate(value?: string | null): string {
	if (!value) return "";
	const d = leerFecha(value);
	return Number.isNaN(d.getTime()) ? value : componerFecha(d);
}

export function formatDateTime(value?: string | null): string {
	if (!value) return "";
	const d = leerFecha(value);
	if (Number.isNaN(d.getTime())) return value;
	const hora = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
	return `${componerFecha(d)} ${hora}`;
}
