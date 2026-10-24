import { useState } from "react";
import { Lock, LockOpen, RotateCcw } from "lucide-react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import { ModalAbrirCaja, ModalCerrarCaja, ModalReabrirCaja } from "./ModalesCaja";
import { useAccionRapida } from "../hooks/useAccionRapida";
import { notificarCambioCaja } from "../hooks/useEstadoCaja";
import type { AperturaCaja, EstadoCaja } from "../services/cajaService";
import "./AperturaCaja.css";

type AperturaCajaControlProps = {
	estado: EstadoCaja | null;
	ultimoCierre?: AperturaCaja | null;
	onChange?: () => void;
};

type ModalActivo = "abrir" | "cerrar" | "reabrir" | null;

function esDeHoy(iso: string | null | undefined) {
	if (!iso) return false;
	const fecha = new Date(iso);
	return !Number.isNaN(fecha.getTime()) && fecha.toDateString() === new Date().toDateString();
}

export default function AperturaCajaControl({ estado, ultimoCierre = null, onChange }: AperturaCajaControlProps) {
	const [modal, setModal] = useState<ModalActivo>(null);

	useAccionRapida("abrir", () => setModal("abrir"));

	if (!estado) return null;

	const puedeReabrir = !estado.abierta && ultimoCierre !== null && esDeHoy(ultimoCierre.fechaCierre);

	function terminar() {
		notificarCambioCaja();
		onChange?.();
	}

	const etiqueta = estado.requiereCierre ? "Cierre pendiente" : estado.abierta ? "Caja abierta" : "Caja cerrada";
	const variante = estado.requiereCierre ? "pendiente" : estado.abierta ? "abierta" : "cerrada";

	return (
		<>
			<span className={`apc__estado apc__estado--${variante}`}>
				<span className="apc__punto" aria-hidden="true" />
				{etiqueta}
			</span>

			{estado.abierta ? (
				<SecondaryButton type="button" onClick={() => setModal("cerrar")}>
					<Lock size={14} strokeWidth={2} />
					<span>Cerrar caja</span>
				</SecondaryButton>
			) : (
				<>
					{puedeReabrir ? (
						<SecondaryButton type="button" onClick={() => setModal("reabrir")}>
							<RotateCcw size={14} strokeWidth={2} />
							<span>Reabrir cierre</span>
						</SecondaryButton>
					) : null}
					<PrimaryButton type="button" onClick={() => setModal("abrir")}>
						<LockOpen size={14} strokeWidth={2} />
						<span>Abrir caja</span>
					</PrimaryButton>
				</>
			)}

			{modal === "abrir" && !estado.abierta ? (
				<ModalAbrirCaja estado={estado} onClose={() => setModal(null)} onDone={terminar} />
			) : null}
			{modal === "cerrar" && estado.abierta ? (
				<ModalCerrarCaja estado={estado} onClose={() => setModal(null)} onDone={terminar} />
			) : null}
			{modal === "reabrir" && puedeReabrir ? (
				<ModalReabrirCaja estado={estado} onClose={() => setModal(null)} onDone={terminar} />
			) : null}
		</>
	);
}
