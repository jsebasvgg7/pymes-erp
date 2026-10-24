import { useMemo, useState } from "react";
import Modal from "../Modal";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";
import type { FilaConfig } from "../../utils/configuracionModulos";

type ConfigModalEditarProps = {
	fila: FilaConfig;
	valorInicial: string;
	guardando: boolean;
	error: string | null;
	onGuardar: (valor: string) => void;
	onCerrar: () => void;
};

const FORM_ID = "set-edit-form";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConfigModalEditar({ fila, valorInicial, guardando, error, onGuardar, onCerrar }: ConfigModalEditarProps) {
	const [valor, setValor] = useState(valorInicial);

	const mensajeValidacion = useMemo(() => {
		const limpio = valor.trim();
		if (fila.requerido && limpio.length === 0) return "Este dato es obligatorio.";
		if (fila.tipoInput === "email" && limpio.length > 0 && !EMAIL_REGEX.test(limpio)) {
			return "Escribe un correo válido, por ejemplo nombre@dominio.com.";
		}
		return null;
	}, [valor, fila.requerido, fila.tipoInput]);

	const sinCambios = valor.trim() === valorInicial.trim();
	const mensaje = error ?? (mensajeValidacion && !sinCambios ? mensajeValidacion : null);
	const bloqueado = guardando || sinCambios || mensajeValidacion !== null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (bloqueado) return;
		onGuardar(valor.trim());
	};

	return (
		<Modal
			open
			size="sm"
			title={fila.etiqueta}
			subtitle={fila.descripcion}
			onClose={guardando ? undefined : onCerrar}
			footer={
				<>
					<SecondaryButton type="button" onClick={onCerrar} disabled={guardando}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="submit" form={FORM_ID} disabled={bloqueado}>
						{guardando ? "Guardando..." : "Guardar"}
					</PrimaryButton>
				</>
			}
		>
			<form id={FORM_ID} className="set__editForm" onSubmit={handleSubmit} noValidate>
				<label htmlFor="set-edit-input">{fila.etiqueta}</label>
				<input
					id="set-edit-input"
					type={fila.tipoInput ?? "text"}
					value={valor}
					maxLength={fila.maxLength}
					onChange={(e) => setValor(e.target.value)}
					autoFocus
					aria-invalid={mensaje ? true : undefined}
					aria-describedby={mensaje ? "set-edit-msg" : undefined}
				/>
				{mensaje ? (
					<p id="set-edit-msg" className="set__editMsg" role="alert">
						{mensaje}
					</p>
				) : null}
			</form>
		</Modal>
	);
}
