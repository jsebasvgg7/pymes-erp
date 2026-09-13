import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { cajaService, type CajaResumen, type MovimientoCajaResponse } from "../services/cajaService";
import "./CajaPage.css";

type CashFormState = {
	tipo: "INGRESO" | "EGRESO";
	descripcion: string;
	monto: string;
};

const defaultFormState: CashFormState = {
	tipo: "INGRESO",
	descripcion: "",
	monto: ""
};

type NewCajaFormState = {
	nombre: string;
	saldoInicial: string;
};

const defaultNewCajaForm: NewCajaFormState = {
	nombre: "",
	saldoInicial: ""
};

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateLabel(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function parseDecimalInput(value: string) {
	const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : 0;
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export default function CajaPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [cajas, setCajas] = useState<CajaResumen[]>([]);
	const [cajaId, setCajaId] = useState<number | null>(null);
	const [movimientos, setMovimientos] = useState<MovimientoCajaResponse[]>([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState<CashFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [newCajaModalOpen, setNewCajaModalOpen] = useState(false);
	const [newCajaForm, setNewCajaForm] = useState<NewCajaFormState>(defaultNewCajaForm);
	const [creatingCaja, setCreatingCaja] = useState(false);
	const [newCajaError, setNewCajaError] = useState<string | null>(null);

	const loadCajas = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const data = await cajaService.obtenerResumenTodas(empresaId);
			setCajas(data);
			setCajaId((prev) => prev ?? data[0]?.cajaId ?? null);
		} catch {
			setError("No se pudo cargar la información de caja. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadCajas();
	}, [loadCajas]);

	const loadMovimientos = useCallback(async () => {
		if (!cajaId) {
			setMovimientos([]);
			return;
		}

		try {
			const data = await cajaService.listarMovimientosPorCaja(cajaId);
			setMovimientos(data.content);
		} catch {
			setError("No se pudo cargar los movimientos de la caja seleccionada.");
		}
	}, [cajaId]);

	useEffect(() => {
		loadMovimientos();
	}, [loadMovimientos]);

	const cajaActual = useMemo(() => cajas.find((c) => c.cajaId === cajaId) ?? null, [cajas, cajaId]);

	const openModal = useCallback(() => {
		setForm(defaultFormState);
		setFormError(null);
		setModalOpen(true);
	}, []);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setFormError(null);
	}, []);

	const isValid = useMemo(() => {
		const descripcionOk = form.descripcion.trim().length > 0;
		const monto = parseDecimalInput(form.monto);
		return descripcionOk && monto > 0;
	}, [form.descripcion, form.monto]);

	const handleSave = useCallback(async () => {
		if (!isValid || !empresaId || !cajaId) return;

		setSaving(true);
		setFormError(null);
		try {
			await cajaService.registrarMovimiento({
				empresaId,
				cajaId,
				tipo: form.tipo,
				monto: parseDecimalInput(form.monto),
				descripcion: form.descripcion.trim()
			});

			await Promise.all([loadCajas(), loadMovimientos()]);
			closeModal();
		} catch (err) {
			setFormError(extractErrorMessage(err, "No se pudo registrar el movimiento. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}, [cajaId, closeModal, empresaId, form.descripcion, form.monto, form.tipo, isValid, loadCajas, loadMovimientos]);

	const openNewCajaModal = useCallback(() => {
		setNewCajaForm(defaultNewCajaForm);
		setNewCajaError(null);
		setNewCajaModalOpen(true);
	}, []);

	const closeNewCajaModal = useCallback(() => {
		setNewCajaModalOpen(false);
		setNewCajaError(null);
	}, []);

	const isNewCajaValid = useMemo(() => newCajaForm.nombre.trim().length > 0, [newCajaForm.nombre]);

	const handleCreateCaja = useCallback(async () => {
		if (!isNewCajaValid || !empresaId) return;

		setCreatingCaja(true);
		setNewCajaError(null);
		try {
			const saldoInicial = newCajaForm.saldoInicial.trim() ? parseDecimalInput(newCajaForm.saldoInicial) : undefined;
			await cajaService.crear({
				empresaId,
				nombre: newCajaForm.nombre.trim(),
				saldoInicial
			});

			await loadCajas();
			closeNewCajaModal();
		} catch (err) {
			setNewCajaError(extractErrorMessage(err, "No se pudo crear la caja. Intenta nuevamente."));
		} finally {
			setCreatingCaja(false);
		}
	}, [closeNewCajaModal, empresaId, isNewCajaValid, loadCajas, newCajaForm.nombre, newCajaForm.saldoInicial]);

	const columns: Array<DataTableColumn<MovimientoCajaResponse>> = useMemo(
		() => [
			{ key: "fecha", header: "Fecha", render: (r) => formatDateLabel(r.fecha) },
			{
				key: "tipo",
				header: "Tipo",
				render: (r) => (
					<span className={["cash__typeBadge", r.tipo === "INGRESO" ? "cash__typeBadge--in" : "cash__typeBadge--out"].join(" ")}>
						<StatusBadge status={r.tipo === "INGRESO" ? "Pagado" : "Anulado"} />
					</span>
				)
			},
			{ key: "descripcion", header: "Concepto", render: (r) => r.descripcion || "—" },
			{ key: "formaPago", header: "Forma de pago", render: (r) => r.formaPagoNombre || "—" },
			{ key: "monto", header: "Valor", align: "right", render: (r) => formatCurrency(r.monto) }
		],
		[]
	);

	if (loading) {
		return (
			<div className="cash">
				<LoadingState label="Cargando caja..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="cash">
				<div className="cash__state cash__state--error">{error}</div>
			</div>
		);
	}

	if (cajas.length === 0) {
		return (
			<div className="cash">
				<PageHeader
					title="Caja"
					subtitle="Control de ingresos y egresos del negocio."
					actions={
						<PrimaryButton type="button" onClick={openNewCajaModal}>
							Crear Caja
						</PrimaryButton>
					}
				/>
				<div className="cash__empty cash__empty--page">
					<div className="cash__emptyTitle">No hay ninguna caja registrada para esta empresa.</div>
					<div className="cash__emptySubtitle">
						Se necesita al menos una caja activa antes de poder registrar movimientos, ventas o compras. Crea la primera
						caja para empezar.
					</div>
				</div>

				<Modal
					open={newCajaModalOpen}
					title="Crear Caja"
					onClose={closeNewCajaModal}
					footer={
						<div className="cash__modalActions">
							<SecondaryButton type="button" onClick={closeNewCajaModal} disabled={creatingCaja}>
								Cancelar
							</SecondaryButton>
							<PrimaryButton type="button" onClick={handleCreateCaja} disabled={!isNewCajaValid || creatingCaja}>
								{creatingCaja ? "Creando..." : "Crear Caja"}
							</PrimaryButton>
						</div>
					}
				>
					<form className="cash__form" onSubmit={(e) => e.preventDefault()}>
						<div className="cash__grid">
							<div className="cash__field cash__field--full">
								<label className="cash__label">Nombre</label>
								<input
									className="cash__input"
									type="text"
									placeholder="Ej: Caja Principal"
									value={newCajaForm.nombre}
									onChange={(e) => setNewCajaForm((v) => ({ ...v, nombre: e.target.value }))}
								/>
							</div>

							<div className="cash__field cash__field--full">
								<label className="cash__label">Saldo inicial (opcional)</label>
								<input
									className="cash__input"
									type="text"
									placeholder="$0"
									inputMode="decimal"
									value={newCajaForm.saldoInicial}
									onChange={(e) => setNewCajaForm((v) => ({ ...v, saldoInicial: e.target.value }))}
								/>
							</div>

							{newCajaError ? <div className="cash__field cash__field--full cash__formError">{newCajaError}</div> : null}
						</div>
					</form>
				</Modal>
			</div>
		);
	}

	return (
		<div className="cash">
			<PageHeader
				title="Caja"
				subtitle="Control de ingresos y egresos del negocio."
				actions={
					<div className="cash__headerActions">
						<SecondaryButton type="button" onClick={openNewCajaModal}>
							Nueva Caja
						</SecondaryButton>
						<PrimaryButton type="button" onClick={openModal}>
							Nuevo Movimiento
						</PrimaryButton>
					</div>
				}
			/>

			{cajas.length > 1 ? (
				<div className="cash__controls">
					<div className="cash__field">
						<label className="cash__label">Caja</label>
						<select
							className="cash__select"
							value={cajaId ?? ""}
							onChange={(e) => setCajaId(Number(e.target.value))}
						>
							{cajas.map((c) => (
								<option key={c.cajaId} value={c.cajaId}>
									{c.cajaNombre}
								</option>
							))}
						</select>
					</div>
				</div>
			) : null}

			<section className="cash__metrics" aria-label="Resumen">
				<StatCard
					icon={<Wallet size={20} strokeWidth={1.8} />}
					title="Saldo Actual"
					value={formatCurrency(cajaActual?.saldoActual ?? 0)}
					color="blue"
					footnote={cajaActual?.cajaNombre}
				/>
				<StatCard
					icon={<TrendingUp size={20} strokeWidth={1.8} />}
					title="Total ingresos"
					value={formatCurrency(cajaActual?.totalIngresos ?? 0)}
					color="green"
					footnote="Histórico de la caja"
				/>
				<StatCard
					icon={<TrendingDown size={20} strokeWidth={1.8} />}
					title="Total egresos"
					value={formatCurrency(cajaActual?.totalEgresos ?? 0)}
					color="red"
					footnote="Histórico de la caja"
				/>
				<StatCard
					icon={<Receipt size={20} strokeWidth={1.8} />}
					title="Movimientos registrados"
					value={(cajaActual?.totalMovimientos ?? 0).toLocaleString("es-CO")}
					color="amber"
					footnote="Total"
				/>
			</section>

			<div className="cash__table">
				<DataTable
					columns={columns}
					data={movimientos}
					emptyState={
						<div className="cash__empty">
							<div className="cash__emptyTitle">No existen movimientos registrados.</div>
							<div className="cash__emptySubtitle">Registra el primer movimiento para comenzar el control de caja.</div>
						</div>
					}
				/>
			</div>

			<Modal
				open={modalOpen}
				title="Nuevo Movimiento"
				onClose={closeModal}
				footer={
					<div className="cash__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!isValid || saving}>
							{saving ? "Guardando..." : "Guardar Movimiento"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="cash__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cash__grid">
						<div className="cash__field">
							<label className="cash__label">Tipo</label>
							<select
								className="cash__select"
								value={form.tipo}
								onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value as "INGRESO" | "EGRESO" }))}
							>
								<option value="INGRESO">Ingreso</option>
								<option value="EGRESO">Egreso</option>
							</select>
						</div>

						<div className="cash__field">
							<label className="cash__label">Valor</label>
							<input
								className="cash__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={form.monto}
								onChange={(e) => setForm((v) => ({ ...v, monto: e.target.value }))}
							/>
						</div>

						<div className="cash__field cash__field--full">
							<label className="cash__label">Concepto</label>
							<input
								className="cash__input"
								type="text"
								placeholder="Ej: Pago de servicios"
								value={form.descripcion}
								onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
							/>
						</div>

						{formError ? <div className="cash__field cash__field--full cash__formError">{formError}</div> : null}
					</div>
				</form>
			</Modal>

			<Modal
				open={newCajaModalOpen}
				title="Crear Caja"
				onClose={closeNewCajaModal}
				footer={
					<div className="cash__modalActions">
						<SecondaryButton type="button" onClick={closeNewCajaModal} disabled={creatingCaja}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleCreateCaja} disabled={!isNewCajaValid || creatingCaja}>
							{creatingCaja ? "Creando..." : "Crear Caja"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="cash__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cash__grid">
						<div className="cash__field cash__field--full">
							<label className="cash__label">Nombre</label>
							<input
								className="cash__input"
								type="text"
								placeholder="Ej: Caja Principal"
								value={newCajaForm.nombre}
								onChange={(e) => setNewCajaForm((v) => ({ ...v, nombre: e.target.value }))}
							/>
						</div>

						<div className="cash__field cash__field--full">
							<label className="cash__label">Saldo inicial (opcional)</label>
							<input
								className="cash__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={newCajaForm.saldoInicial}
								onChange={(e) => setNewCajaForm((v) => ({ ...v, saldoInicial: e.target.value }))}
							/>
						</div>

						{newCajaError ? <div className="cash__field cash__field--full cash__formError">{newCajaError}</div> : null}
					</div>
				</form>
			</Modal>
		</div>
	);
}