import { useCallback, useEffect, useState } from "react";
import { cajaService, type EstadoCaja } from "../services/cajaService";

const EVENTO_CAMBIO = "caja-estado-cambiado";

export function notificarCambioCaja() {
	window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function useEstadoCaja(empresaId?: number) {
	const [estados, setEstados] = useState<EstadoCaja[]>([]);
	const [cargado, setCargado] = useState(false);

	const recargar = useCallback(async () => {
		if (!empresaId) {
			setEstados([]);
			setCargado(true);
			return;
		}
		try {
			const data = await cajaService.obtenerEstados(empresaId);
			setEstados(Array.isArray(data) ? data : []);
		} catch {
			setEstados((prev) => prev);
		} finally {
			setCargado(true);
		}
	}, [empresaId]);

	useEffect(() => {
		recargar();
		const alVolver = () => {
			if (document.visibilityState === "visible") recargar();
		};
		window.addEventListener(EVENTO_CAMBIO, recargar);
		window.addEventListener("focus", alVolver);
		document.addEventListener("visibilitychange", alVolver);
		return () => {
			window.removeEventListener(EVENTO_CAMBIO, recargar);
			window.removeEventListener("focus", alVolver);
			document.removeEventListener("visibilitychange", alVolver);
		};
	}, [recargar]);

	return { estados, cargado, recargar };
}
