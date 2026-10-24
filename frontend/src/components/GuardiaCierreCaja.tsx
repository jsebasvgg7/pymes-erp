import { ModalCerrarCaja } from "./ModalesCaja";
import { notificarCambioCaja, useEstadoCaja } from "../hooks/useEstadoCaja";
import { authService } from "../services/authService";

export default function GuardiaCierreCaja() {
	const empresaId = authService.getUsuario()?.empresaId;
	const { estados } = useEstadoCaja(empresaId);
	const pendiente = estados.find((e) => e.requiereCierre);

	if (!pendiente) return null;

	return <ModalCerrarCaja key={pendiente.cajaId} estado={pendiente} obligatorio onClose={() => undefined} onDone={notificarCambioCaja} />;
}
