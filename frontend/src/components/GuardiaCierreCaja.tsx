import { useEffect, useState } from "react";
import { ModalCerrarCaja } from "./ModalesCaja";
import { notificarCambioCaja, useEstadoCaja } from "../hooks/useEstadoCaja";
import { authService } from "../services/authService";
import { useAjustes } from "../utils/ajustesConfig";
import { msHastaHora } from "../utils/horaCaja";

const POSPONER_MS = 30 * 60 * 1000;
const MARGEN_MS = 2000;

export default function GuardiaCierreCaja() {
	const empresaId = authService.getUsuario()?.empresaId;
	const { estados, recargar } = useEstadoCaja(empresaId);
	const { horaCierreAutomatico } = useAjustes();
	const [pospuestoHasta, setPospuestoHasta] = useState(0);
	const [ronda, setRonda] = useState(0);
	const hayAbierta = estados.some((e) => e.abierta);

	useEffect(() => {
		if (!hayAbierta) return;
		const id = window.setTimeout(() => {
			recargar();
			setRonda((actual) => actual + 1);
		}, msHastaHora(horaCierreAutomatico) + MARGEN_MS);
		return () => window.clearTimeout(id);
	}, [hayAbierta, horaCierreAutomatico, ronda, recargar]);

	useEffect(() => {
		if (pospuestoHasta === 0) return;
		const id = window.setTimeout(() => {
			setPospuestoHasta(0);
			recargar();
		}, Math.max(pospuestoHasta - Date.now(), 0));
		return () => window.clearTimeout(id);
	}, [pospuestoHasta, recargar]);

	const pendiente = estados.find((e) => e.requiereCierre);

	if (!pendiente || pospuestoHasta > 0) return null;

	return (
		<ModalCerrarCaja
			key={pendiente.cajaId}
			estado={pendiente}
			aviso
			onClose={() => setPospuestoHasta(Date.now() + POSPONER_MS)}
			onDone={notificarCambioCaja}
		/>
	);
}
