import { useSyncExternalStore } from "react";

export type AnchoRecibo = 58 | 80;

export type AjustesConfig = {
	stockMinimoDefecto: number;
	avisarStockBajo: boolean;
	clienteObligatorio: boolean;
	anchoRecibo: AnchoRecibo;
	nombreRecibo: string;
	mensajePieRecibo: string;
	horaCierreAutomatico: string;
};

const AJUSTES_INICIALES: AjustesConfig = {
	stockMinimoDefecto: 0,
	avisarStockBajo: true,
	clienteObligatorio: false,
	anchoRecibo: 58,
	nombreRecibo: "",
	mensajePieRecibo: "",
	horaCierreAutomatico: "04:00"
};

let estado: AjustesConfig = AJUSTES_INICIALES;
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

export function ajustesActuales(): AjustesConfig {
	return estado;
}

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function textoOActual(nuevo: unknown, actual: string): string {
	return typeof nuevo === "string" ? nuevo : actual;
}

export function setAjustes(parcial: Partial<AjustesConfig>) {
	const stock = Number(parcial.stockMinimoDefecto);
	const ancho = Number(parcial.anchoRecibo);
	const siguiente: AjustesConfig = {
		stockMinimoDefecto:
			parcial.stockMinimoDefecto !== undefined && Number.isFinite(stock) && stock >= 0 ? stock : estado.stockMinimoDefecto,
		avisarStockBajo: typeof parcial.avisarStockBajo === "boolean" ? parcial.avisarStockBajo : estado.avisarStockBajo,
		clienteObligatorio:
			typeof parcial.clienteObligatorio === "boolean" ? parcial.clienteObligatorio : estado.clienteObligatorio,
		anchoRecibo: ancho === 58 || ancho === 80 ? ancho : estado.anchoRecibo,
		nombreRecibo: textoOActual(parcial.nombreRecibo, estado.nombreRecibo),
		mensajePieRecibo: textoOActual(parcial.mensajePieRecibo, estado.mensajePieRecibo),
		horaCierreAutomatico:
			typeof parcial.horaCierreAutomatico === "string" && FORMATO_HORA.test(parcial.horaCierreAutomatico)
				? parcial.horaCierreAutomatico
				: estado.horaCierreAutomatico
	};
	if (
		siguiente.stockMinimoDefecto === estado.stockMinimoDefecto &&
		siguiente.avisarStockBajo === estado.avisarStockBajo &&
		siguiente.clienteObligatorio === estado.clienteObligatorio &&
		siguiente.anchoRecibo === estado.anchoRecibo &&
		siguiente.nombreRecibo === estado.nombreRecibo &&
		siguiente.mensajePieRecibo === estado.mensajePieRecibo &&
		siguiente.horaCierreAutomatico === estado.horaCierreAutomatico
	) {
		return;
	}
	estado = siguiente;
	oyentes.forEach((oyente) => oyente());
}

export function useAjustes(): AjustesConfig {
	return useSyncExternalStore(suscribir, leerEstado);
}
