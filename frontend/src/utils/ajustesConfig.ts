import { useSyncExternalStore } from "react";

export type AjustesConfig = {
	stockMinimoDefecto: number;
	avisarStockBajo: boolean;
	clienteObligatorio: boolean;
};

const AJUSTES_INICIALES: AjustesConfig = {
	stockMinimoDefecto: 0,
	avisarStockBajo: true,
	clienteObligatorio: false
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

export function setAjustes(parcial: Partial<AjustesConfig>) {
	const stock = Number(parcial.stockMinimoDefecto);
	const siguiente: AjustesConfig = {
		stockMinimoDefecto:
			parcial.stockMinimoDefecto !== undefined && Number.isFinite(stock) && stock >= 0 ? stock : estado.stockMinimoDefecto,
		avisarStockBajo: typeof parcial.avisarStockBajo === "boolean" ? parcial.avisarStockBajo : estado.avisarStockBajo,
		clienteObligatorio:
			typeof parcial.clienteObligatorio === "boolean" ? parcial.clienteObligatorio : estado.clienteObligatorio
	};
	if (
		siguiente.stockMinimoDefecto === estado.stockMinimoDefecto &&
		siguiente.avisarStockBajo === estado.avisarStockBajo &&
		siguiente.clienteObligatorio === estado.clienteObligatorio
	) {
		return;
	}
	estado = siguiente;
	oyentes.forEach((oyente) => oyente());
}

export function useAjustes(): AjustesConfig {
	return useSyncExternalStore(suscribir, leerEstado);
}
