import { Pencil } from "lucide-react";
import type { FilaConfig } from "../../utils/configuracionModulos";

type ConfigFilaProps = {
	fila: FilaConfig;
	valor: string;
	onEditar: (fila: FilaConfig) => void;
	activo?: boolean;
	cambiando?: boolean;
	onCambiar?: (fila: FilaConfig, activo: boolean) => void;
};

export default function ConfigFila({ fila, valor, onEditar, activo = false, cambiando = false, onCambiar }: ConfigFilaProps) {
	const editable = Boolean(fila.campo || fila.campoConfig);
	const vacio = valor.trim().length === 0;

	let textoValor = valor;
	if (!editable) textoValor = fila.valorFijo ?? "—";
	else if (vacio) textoValor = fila.textoVacio ?? "Sin definir";

	const valorMuted = !editable || vacio;

	return (
		<li className="set__row">
			<div className="set__rowInfo">
				<span className="set__rowLabel">{fila.etiqueta}</span>
				<span className="set__rowHint">{fila.descripcion}</span>
			</div>
			<div className={["set__rowValue", valorMuted ? "set__rowValue--muted" : ""].filter(Boolean).join(" ")}>
				{textoValor}
			</div>
			<div className="set__rowAction">
				{fila.interruptor && onCambiar ? (
					<button
						type="button"
						role="switch"
						aria-checked={activo}
						aria-label={fila.etiqueta}
						className={["set__switch", activo ? "set__switch--on" : ""].filter(Boolean).join(" ")}
						disabled={cambiando}
						onClick={() => onCambiar(fila, !activo)}
					/>
				) : editable ? (
					<button
						type="button"
						className="set__edit"
						onClick={() => onEditar(fila)}
						aria-label={`Editar ${fila.etiqueta}`}
					>
						<Pencil size={14} aria-hidden="true" />
						<span>Editar</span>
					</button>
				) : (
					<span className="set__soon">Próximamente</span>
				)}
			</div>
		</li>
	);
}
