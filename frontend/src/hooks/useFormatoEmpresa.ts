import { useEffect } from "react";
import { configuracionService, type Configuracion } from "../services/configuracionService";
import { setFormato, type FormatoConfig } from "../utils/formatoConfig";

const clave = (empresaId: number) => `configuracionFormato:${empresaId}`;

export function aplicarFormatoEmpresa(empresaId: number, configuracion: Configuracion) {
	const formato: FormatoConfig = {
		moneda: configuracion.moneda,
		simboloMoneda: configuracion.simboloMoneda,
		formatoFecha: configuracion.formatoFecha
	};
	setFormato(formato);
	try {
		localStorage.setItem(clave(empresaId), JSON.stringify(formato));
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
		} catch {
			localStorage.removeItem(clave(empresaId));
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
