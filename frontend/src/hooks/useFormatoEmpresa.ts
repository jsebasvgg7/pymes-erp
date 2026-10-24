import { useEffect } from "react";
import { configuracionService, type Configuracion } from "../services/configuracionService";
import { setFormato, type FormatoConfig } from "../utils/formatoConfig";
import { setAjustes, type AjustesConfig } from "../utils/ajustesConfig";

const clave = (empresaId: number) => `configuracionFormato:${empresaId}`;
const claveAjustes = (empresaId: number) => `configuracionAjustes:${empresaId}`;

export function aplicarFormatoEmpresa(empresaId: number, configuracion: Configuracion) {
	const formato: FormatoConfig = {
		moneda: configuracion.moneda,
		simboloMoneda: configuracion.simboloMoneda,
		formatoFecha: configuracion.formatoFecha
	};
	const ajustes: AjustesConfig = {
		stockMinimoDefecto: Number(configuracion.stockMinimoDefecto),
		avisarStockBajo: configuracion.avisarStockBajo,
		clienteObligatorio: configuracion.clienteObligatorio,
		anchoRecibo: configuracion.anchoRecibo === 80 ? 80 : 58,
		nombreRecibo: configuracion.nombreRecibo ?? "",
		mensajePieRecibo: configuracion.mensajePieRecibo ?? ""
	};
	setFormato(formato);
	setAjustes(ajustes);
	try {
		localStorage.setItem(clave(empresaId), JSON.stringify(formato));
		localStorage.setItem(claveAjustes(empresaId), JSON.stringify(ajustes));
	} catch {
		return;
	}
}

export function useFormatoEmpresa(empresaId?: number) {
	useEffect(() => {
		if (!empresaId) return;
		try {
			const guardado = localStorage.getItem(clave(empresaId));
			if (guardado) setFormato(JSON.parse(guardado));
			const guardadoAjustes = localStorage.getItem(claveAjustes(empresaId));
			if (guardadoAjustes) setAjustes(JSON.parse(guardadoAjustes));
		} catch {
			localStorage.removeItem(clave(empresaId));
			localStorage.removeItem(claveAjustes(empresaId));
		}

		let activo = true;
		configuracionService
			.obtener(empresaId)
			.then((configuracion) => {
				if (activo) aplicarFormatoEmpresa(empresaId, configuracion);
			})
			.catch(() => {});
		return () => {
			activo = false;
		};
	}, [empresaId]);
}
