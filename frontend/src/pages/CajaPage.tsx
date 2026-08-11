import { useMemo, useState } from "react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { addCashMovement, getCashMovements, type CashMovement, type CashMovementType } from "../services/cashStorage";
import "./CajaPage.css";

type CashFormState = {
	tipo: CashMovementType;
	concepto: string;
	valor: string;
	observacion: string;
};

const defaultFormState: CashFormState = {
	tipo: "Ingreso",
	concepto: "",
	valor: "",
	observacion: ""
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

function getLocalDateKey(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function CajaPage() {
	const [modalOpen, setModalOpen] = useState(false);
	const [movements, setMovements] = useState<CashMovement[]>(() => getCashMovements());
	const [form, setForm] = useState<CashFormState>(defaultFormState);

	const todayKey = useMemo(() => getLocalDateKey(new Date()), []);

	const computed = useMemo(() => {
		let ingresos = 0;
		let egresos = 0;
		let ingresosDia = 0;
		let egresosDia = 0;

		movements.forEach((m) => {
			const isToday = getLocalDateKey(new Date(m.fecha)) === todayKey;
			if (m.tipo === "Ingreso") {
				ingresos += m.valor;
				if (isToday) ingresosDia += m.valor;
			} else {
				egresos += m.valor;
				if (isToday) egresosDia += m.valor;
			}
		});

		return {
			ingresos,
			egresos,
			ingresosDia,
			egresosDia,
			saldo: ingresos - egresos,
			totalMovimientos: movements.length
		};
	}, [movements, todayKey]);

	const openModal = () => {
		setForm(defaultFormState);
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
	};

	const isValid = useMemo(() => {
		const conceptoOk = form.concepto.trim().length > 0;
		const valor = parseDecimalInput(form.valor);
		return conceptoOk && valor > 0;
	}, [form.concepto, form.valor]);

	const handleSave = () => {
		if (!isValid) return;

		const created = addCashMovement({
			tipo: form.tipo,
			concepto: form.concepto.trim(),
			valor: parseDecimalInput(form.valor),
			observacion: form.observacion
		});

		setMovements((prev) => [...prev, created]);
		closeModal();
	};

	const columns: Array<DataTableColumn<CashMovement>> = useMemo(
		() => [
			{ key: "fecha", header: "Fecha", render: (r) => formatDateLabel(r.fecha) },
			{
				key: "tipo",
				header: "Tipo",
				render: (r) => (
					<span className={["cash__typeBadge", r.tipo === "Ingreso" ? "cash__typeBadge--in" : "cash__typeBadge--out"].join(" ")}>
						<StatusBadge status={r.tipo === "Ingreso" ? "Pagado" : "Anulado"} />
					</span>
				)
			},
			{ key: "concepto", header: "Concepto", render: (r) => r.concepto },
			{ key: "valor", header: "Valor", align: "right", render: (r) => formatCurrency(r.valor) },
			{ key: "observacion", header: "Observación", render: (r) => r.observacion ?? "" }
		],
		[]
	);

	return (
		<div className="cash">
			<PageHeader
				title="Caja"
				subtitle="Control de ingresos y egresos del negocio."
				actions={
					<PrimaryButton type="button" onClick={openModal}>
						Nuevo Movimiento
					</PrimaryButton>
				}
			/>

			<section className="cash__metrics" aria-label="Resumen">
				<StatCard icon="💰" title="Saldo Actual" value={formatCurrency(computed.saldo)} color="blue" footnote="Calculado" />
				<StatCard
					icon="🟢"
					title="Ingresos del día"
					value={formatCurrency(computed.ingresosDia)}
					color="green"
					footnote="Hoy"
				/>
				<StatCard
					icon="🔴"
					title="Egresos del día"
					value={formatCurrency(computed.egresosDia)}
					color="red"
					footnote="Hoy"
				/>
				<StatCard
					icon="🧾"
					title="Movimientos registrados"
					value={computed.totalMovimientos.toLocaleString("es-CO")}
					color="amber"
					footnote="Total"
				/>
			</section>

			<div className="cash__table">
				<DataTable
					columns={columns}
					data={movements}
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
						<SecondaryButton type="button" onClick={closeModal}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!isValid}>
							Guardar Movimiento
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
								onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value as CashMovementType }))}
							>
								<option value="Ingreso">Ingreso</option>
								<option value="Egreso">Egreso</option>
							</select>
						</div>

						<div className="cash__field">
							<label className="cash__label">Valor</label>
							<input
								className="cash__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={form.valor}
								onChange={(e) => setForm((v) => ({ ...v, valor: e.target.value }))}
							/>
						</div>

						<div className="cash__field cash__field--full">
							<label className="cash__label">Concepto</label>
							<input
								className="cash__input"
								type="text"
								placeholder="Ej: Pago de servicios"
								value={form.concepto}
								onChange={(e) => setForm((v) => ({ ...v, concepto: e.target.value }))}
							/>
						</div>

						<div className="cash__field cash__field--full">
							<label className="cash__label">Observación (opcional)</label>
							<textarea
								className="cash__textarea"
								rows={3}
								placeholder="Observación..."
								value={form.observacion}
								onChange={(e) => setForm((v) => ({ ...v, observacion: e.target.value }))}
							/>
						</div>
					</div>
				</form>
			</Modal>
		</div>
	);
}

