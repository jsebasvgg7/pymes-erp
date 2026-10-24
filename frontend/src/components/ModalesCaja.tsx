import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, LockOpen, RotateCcw } from "lucide-react";
import Modal from "./Modal";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import { cajaService, type CierreCajaResultado, type EstadoCaja } from "../services/cajaService";
import { esConflicto, formatoMoneda, mensajeDeError, parseMonto } from "../utils/montoCaja";
import "./AperturaCaja.css";

type ModalAbrirProps = {
	estado: EstadoCaja;
	onClose: () => void;
	onDone: () => void;
};

export function ModalAbrirCaja({ estado, onClose, onDone }: ModalAbrirProps) {
	const [valor, setValor] = useState(estado.efectivoSugerido !== null ? String(estado.efectivoSugerido) : "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const monto = useMemo(() => parseMonto(valor), [valor]);
	const valido = monto !== null && monto >= 0;

	async function confirmar() {
		if (!valido || monto === null) return;
		setSaving(true);
		setError(null);
		try {
			await cajaService.abrirCaja(estado.cajaId, monto);
			onDone();
			onClose();
		} catch (err) {
			setError(mensajeDeError(err, "No se pudo abrir la caja. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}

	return (
		<Modal
			open
			title="Abrir caja"
			subtitle={estado.cajaNombre}
			icon={<LockOpen size={20} strokeWidth={2} />}
			onClose={saving ? undefined : onClose}
			footer={
				<div className="apc__actions">
					<SecondaryButton type="button" onClick={onClose} disabled={saving}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="button" onClick={confirmar} disabled={!valido || saving}>
						{saving ? "Abriendo..." : "Abrir caja"}
					</PrimaryButton>
				</div>
			}
		>
			<form className="apc__modal" onSubmit={(e) => e.preventDefault()}>
				<label className="apc__label" htmlFor="apc-inicial">
					Efectivo con el que inicia
				</label>
				<input
					id="apc-inicial"
					className="apc__input"
					type="text"
					inputMode="decimal"
					placeholder="$0"
					value={valor}
					onChange={(e) => setValor(e.target.value)}
					autoFocus
				/>
				<p className="apc__hint">
					{estado.efectivoSugerido !== null
						? "Sugerido: el efectivo contado en el último cierre. Cámbialo si empiezas con otro valor."
						: "Escribe el efectivo que hay en la caja al empezar. Si no hay nada, deja 0."}
				</p>
				{error ? <div className="apc__error">{error}</div> : null}
			</form>
		</Modal>
	);
}

type ModalCerrarProps = {
	estado: EstadoCaja;
	aviso?: boolean;
	onClose: () => void;
	onDone: () => void;
};

export function ModalCerrarCaja({ estado, aviso = false, onClose, onDone }: ModalCerrarProps) {
	const [valor, setValor] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resultado, setResultado] = useState<CierreCajaResultado | null>(null);
	const [reabriendo, setReabriendo] = useState(false);

	const monto = useMemo(() => parseMonto(valor), [valor]);
	const valido = monto !== null && monto >= 0;

	async function confirmar() {
		if (!valido || monto === null) return;
		setSaving(true);
		setError(null);
		try {
			setResultado(await cajaService.cerrarCaja(estado.cajaId, monto));
		} catch (err) {
			if (esConflicto(err)) {
				onDone();
				onClose();
				return;
			}
			setError(mensajeDeError(err, "No se pudo cerrar la caja. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}

	async function reabrir() {
		setReabriendo(true);
		setError(null);
		try {
			await cajaService.reabrirCaja(estado.cajaId);
			onDone();
			onClose();
		} catch (err) {
			setError(mensajeDeError(err, "No se pudo reabrir la caja. Intenta nuevamente."));
		} finally {
			setReabriendo(false);
		}
	}

	function terminar() {
		onDone();
		onClose();
	}

	if (resultado) {
		const apertura = resultado.apertura;
		const diferencia = apertura.diferencia ?? 0;
		const tipo = apertura.resultado ?? "CUADRADA";
		const titulo =
			tipo === "CUADRADA"
				? "La caja está cuadrada"
				: tipo === "FALTANTE"
					? `Falta ${formatoMoneda(Math.abs(diferencia))}`
					: `Sobra ${formatoMoneda(Math.abs(diferencia))}`;

		return (
			<Modal
				open
				title="Caja cerrada"
				subtitle={estado.cajaNombre}
				icon={<Lock size={20} strokeWidth={2} />}
				footer={
					<div className="apc__actions">
						<SecondaryButton type="button" onClick={reabrir} disabled={reabriendo}>
							<RotateCcw size={14} strokeWidth={2} />
							<span>{reabriendo ? "Reabriendo..." : "Reabrir cierre"}</span>
						</SecondaryButton>
						<PrimaryButton type="button" onClick={terminar} disabled={reabriendo}>
							Entendido
						</PrimaryButton>
					</div>
				}
			>
				<div className="apc__modal">
					<div className={`apc__resultado apc__resultado--${tipo.toLowerCase()}`}>
						{tipo === "CUADRADA" ? <CheckCircle2 size={18} strokeWidth={2} /> : <AlertTriangle size={18} strokeWidth={2} />}
						<strong>{titulo}</strong>
					</div>
					<dl className="apc__resumen">
						<div>
							<dt>Efectivo esperado</dt>
							<dd>{formatoMoneda(apertura.efectivoEsperado)}</dd>
						</div>
						<div>
							<dt>Efectivo contado</dt>
							<dd>{formatoMoneda(apertura.efectivoContado)}</dd>
						</div>
						<div>
							<dt>Diferencia</dt>
							<dd>{formatoMoneda(diferencia)}</dd>
						</div>
					</dl>
					<p className="apc__hint">
						Otros medios de pago en este turno (solo informativo): ingresos {formatoMoneda(resultado.ingresosOtrosMedios)} y egresos{" "}
						{formatoMoneda(resultado.egresosOtrosMedios)}.
					</p>
					{error ? <div className="apc__error">{error}</div> : null}
				</div>
			</Modal>
		);
	}

	return (
		<Modal
			open
			title={aviso ? "Es hora de cerrar la caja" : "Cerrar caja"}
			subtitle={estado.cajaNombre}
			icon={<Lock size={20} strokeWidth={2} />}
			onClose={saving ? undefined : onClose}
			footer={
				<div className="apc__actions">
					<SecondaryButton type="button" onClick={onClose} disabled={saving}>
						{aviso ? "Todavía no" : "Cancelar"}
					</SecondaryButton>
					<PrimaryButton type="button" onClick={confirmar} disabled={!valido || saving}>
						{saving ? "Cerrando..." : "Cerrar caja"}
					</PrimaryButton>
				</div>
			}
		>
			<form className="apc__modal" onSubmit={(e) => e.preventDefault()}>
				{aviso ? (
					<p className="apc__hint">
						Llegó la hora de cierre. Cuenta el efectivo que hay y ciérrala, o elige "Todavía no" para seguir vendiendo; el aviso
						volverá en 30 minutos.
					</p>
				) : null}
				<label className="apc__label" htmlFor="apc-contado">
					Efectivo contado
				</label>
				<input
					id="apc-contado"
					className="apc__input"
					type="text"
					inputMode="decimal"
					placeholder="$0"
					value={valor}
					onChange={(e) => setValor(e.target.value)}
					autoFocus
				/>
				<p className="apc__hint">
					Cuenta el efectivo que hay en la caja y escríbelo. Al confirmar verás el esperado y la diferencia.
				</p>
				{error ? <div className="apc__error">{error}</div> : null}
			</form>
		</Modal>
	);
}

type ModalReabrirProps = {
	estado: EstadoCaja;
	onClose: () => void;
	onDone: () => void;
};

export function ModalReabrirCaja({ estado, onClose, onDone }: ModalReabrirProps) {
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function confirmar() {
		setSaving(true);
		setError(null);
		try {
			await cajaService.reabrirCaja(estado.cajaId);
			onDone();
			onClose();
		} catch (err) {
			setError(mensajeDeError(err, "No se pudo reabrir la caja. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}

	return (
		<Modal
			open
			title="Reabrir último cierre"
			subtitle={estado.cajaNombre}
			icon={<RotateCcw size={20} strokeWidth={2} />}
			onClose={saving ? undefined : onClose}
			footer={
				<div className="apc__actions">
					<SecondaryButton type="button" onClick={onClose} disabled={saving}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="button" onClick={confirmar} disabled={saving}>
						{saving ? "Reabriendo..." : "Reabrir"}
					</PrimaryButton>
				</div>
			}
		>
			<div className="apc__modal">
				<p className="apc__hint">
					La caja volverá a quedar abierta y se borrarán el efectivo contado y la diferencia de ese cierre. Tendrás que cerrarla de
					nuevo. Solo se puede reabrir el último cierre del día en curso.
				</p>
				{error ? <div className="apc__error">{error}</div> : null}
			</div>
		</Modal>
	);
}
