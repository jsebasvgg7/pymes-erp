import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableLayout } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import { authService } from "../services/authService";
import { compraService, type CompraResponse } from "../services/compraService";
import { formaPagoService, type FormaPago } from "../services/formaPagoService";
import { productoService, type Producto } from "../services/ProductoService";
import { proveedorService, type Proveedor } from "../services/proveedorService";
import { useAccionRapida } from "../hooks/useAccionRapida";
import "./ComprasPage.css";

type PurchaseLine = {
	rowId: string;
	productoId: string;
	cantidad: string;
	costoUnitario: string;
};

type ConfirmRemove = { rowId: string } | null;

function generateRowId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDecimalInput(value: string) {
	const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : 0;
}

function parseIntegerInput(value: string) {
	const normalized = value.replace(/[^\d-]/g, "");
	const n = Number(normalized);
	return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateLabel(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-CO");
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export default function ComprasPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [compras, setCompras] = useState<CompraResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [productos, setProductos] = useState<Producto[]>([]);
	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

	const [modalOpen, setModalOpen] = useState(false);
	const [proveedorId, setProveedorId] = useState("");
	const [formaPagoId, setFormaPagoId] = useState("");
	const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [lines, setLines] = useState<PurchaseLine[]>([]);
	const [confirmRemove, setConfirmRemove] = useState<ConfirmRemove>(null);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const loadCompras = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [comprasData, productosData, proveedoresData, formasPagoData] = await Promise.all([
				compraService.listarPorEmpresa(empresaId),
				productoService.listarPorEmpresa(empresaId),
				proveedorService.listarPorEmpresa(empresaId),
				formaPagoService.listarPorEmpresa(empresaId)
			]);
			setCompras(comprasData.content);
			setProductos(productosData.content);
			setProveedores(proveedoresData);
			setFormasPago(formasPagoData.content);
		} catch {
			setError("No se pudo cargar las compras. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadCompras();
	}, [loadCompras]);

	const activeProductos = useMemo(() => productos.filter((p) => p.active), [productos]);
	const activeProveedores = useMemo(() => proveedores.filter((p) => p.active), [proveedores]);
	const activeFormasPago = useMemo(() => formasPago.filter((f) => f.active), [formasPago]);

	const proveedorById = useMemo(() => {
		const map = new Map<string, Proveedor>();
		activeProveedores.forEach((p) => map.set(String(p.id), p));
		return map;
	}, [activeProveedores]);

	const formaPagoById = useMemo(() => {
		const map = new Map<string, FormaPago>();
		activeFormasPago.forEach((f) => map.set(String(f.id), f));
		return map;
	}, [activeFormasPago]);

	const productoById = useMemo(() => {
		const map = new Map<string, Producto>();
		activeProductos.forEach((p) => map.set(String(p.id), p));
		return map;
	}, [activeProductos]);

	const openModal = useCallback(() => {
		setProveedorId("");
		setFormaPagoId("");
		setPurchaseDate(new Date().toISOString().slice(0, 10));
		setLines([]);
		setFormError(null);
		setModalOpen(true);
	}, []);

	useAccionRapida("nuevo", openModal);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setConfirmRemove(null);
		setFormError(null);
	}, []);

	const addLine = useCallback(() => {
		setLines((prev) => [
			...prev,
			{
				rowId: generateRowId(),
				productoId: "",
				cantidad: "",
				costoUnitario: ""
			}
		]);
	}, []);

	const removeLine = useCallback((rowId: string) => {
		setLines((prev) => prev.filter((l) => l.rowId !== rowId));
	}, []);

	const updateLine = useCallback(
		(rowId: string, patch: Partial<Pick<PurchaseLine, "productoId" | "cantidad" | "costoUnitario">>) => {
			setLines((prev) =>
				prev.map((l) => {
					if (l.rowId !== rowId) return l;

					const next: PurchaseLine = { ...l, ...patch };
					if (patch.productoId && patch.productoId !== l.productoId) {
						const p = productoById.get(patch.productoId);
						if (p) {
							next.costoUnitario = String(p.costo);
							next.cantidad = next.cantidad || "1";
						}
					}

					return next;
				})
			);
		},
		[productoById]
	);

	const computed = useMemo(() => {
		const rowSubtotals = new Map<string, number>();
		let total = 0;

		lines.forEach((l) => {
			const qty = parseIntegerInput(l.cantidad);
			const price = parseDecimalInput(l.costoUnitario);
			const subtotal = qty > 0 && price > 0 ? qty * price : 0;
			rowSubtotals.set(l.rowId, subtotal);
			total += subtotal;
		});

		return { rowSubtotals, total };
	}, [lines]);

	const validation = useMemo(() => {
		if (activeProveedores.length === 0) return { ok: false, reason: "no_providers" as const };
		if (activeProductos.length === 0) return { ok: false, reason: "no_products" as const };
		if (activeFormasPago.length === 0) return { ok: false, reason: "no_payment_methods" as const };
		if (!proveedorId) return { ok: false, reason: "missing_provider" as const };
		if (!formaPagoId) return { ok: false, reason: "missing_payment_method" as const };
		if (lines.length === 0) return { ok: false, reason: "no_lines" as const };

		const hasInvalid = lines.some((l) => {
			const qty = parseIntegerInput(l.cantidad);
			const price = parseDecimalInput(l.costoUnitario);
			return !l.productoId || qty <= 0 || price <= 0;
		});

		if (hasInvalid) return { ok: false, reason: "invalid_lines" as const };

		return { ok: true as const };
	}, [activeFormasPago.length, activeProductos.length, activeProveedores.length, formaPagoId, lines, proveedorId]);

	const handleSave = useCallback(async () => {
		if (!validation.ok || !empresaId) return;

		const proveedor = proveedorById.get(proveedorId);
		if (!proveedor) return;

		const formaPago = formaPagoById.get(formaPagoId);
		if (!formaPago) return;

		setSaving(true);
		setFormError(null);
		try {
			const detalles = lines.map((l) => {
				const producto = productoById.get(l.productoId);
				return {
					productoId: Number(l.productoId),
					descripcion: producto?.nombre ?? "Producto",
					cantidad: parseIntegerInput(l.cantidad),
					costoUnitario: parseDecimalInput(l.costoUnitario)
				};
			});

			const created = await compraService.crear({
				empresaId,
				proveedorId: proveedor.id,
				formaPagoId: formaPago.id,
				fechaCompra: `${purchaseDate}T00:00:00`,
				detalles
			});

			setCompras((prev) => [created, ...prev]);

			// Refrescar productos: el backend ajustó stock/costoPromedio al crear la compra.
			productoService
				.listarPorEmpresa(empresaId)
				.then((data) => setProductos(data.content))
				.catch(() => {});

			closeModal();
		} catch (err) {
			setFormError(extractErrorMessage(err, "No se pudo registrar la compra. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}, [closeModal, empresaId, formaPagoById, formaPagoId, lines, productoById, proveedorById, proveedorId, purchaseDate, validation.ok]);

	const listLayout: DataTableLayout<CompraResponse> = {
		principal: (r) => r.proveedorNombre,
		secundario: (r) => `${r.numeroDocumento} · ${formatDateLabel(r.fechaCompra)}`,
		etiquetas: (r) => (r.formaPagoNombre ? <span className="ui-list__chip">{r.formaPagoNombre}</span> : null),
		valor: (r) => formatCurrency(r.total)
	};

	if (loading) {
		return (
			<div className="pur">
				<LoadingState label="Cargando compras..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="pur">
				<div className="pur__state pur__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="pur">
			<PageHeader
				title="Registro de compras"
				subtitle="Registra lo que compras a tus proveedores y mantén el inventario al día."
				actions={
					<PrimaryButton type="button" onClick={openModal}>
						<Plus size={14} strokeWidth={2.2} />
						<span>Nueva compra</span>
					</PrimaryButton>
				}
			/>

			<div className="pur__list">
				<DataTable
					title="Compras"
					layout={listLayout}
					data={compras}
					pageSize={10}
					emptyState={
						<div className="pur__empty">
							<div className="pur__emptyTitle">No hay compras registradas.</div>
							<div className="pur__emptySubtitle">Registra una compra para empezar el historial.</div>
						</div>
					}
				/>
			</div>

			<Modal
				open={modalOpen}
				title="Nueva compra"
				subtitle="Selecciona el proveedor y agrega los productos comprados."
				icon={<ShoppingCart size={20} strokeWidth={2} />}
				size="lg"
				onClose={closeModal}
				footer={
					<div className="pur__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!validation.ok || saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<div className="pur__invoice">
					<div className="pur__topGrid">
						<div className="pur__field">
							<label className="pur__label">Proveedor</label>
							<select className="pur__select" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
								<option value="" disabled>
									Seleccionar...
								</option>
								{activeProveedores.map((p) => (
									<option key={p.id} value={p.id}>
										{p.nombre}
									</option>
								))}
							</select>
						</div>
						<div className="pur__field">
							<label className="pur__label">Forma de pago</label>
							<select className="pur__select" value={formaPagoId} onChange={(e) => setFormaPagoId(e.target.value)}>
								<option value="" disabled>
									Seleccionar...
								</option>
								{activeFormasPago.map((f) => (
									<option key={f.id} value={f.id}>
										{f.nombre}
									</option>
								))}
							</select>
						</div>
						<div className="pur__field">
							<label className="pur__label">Fecha</label>
							<input className="pur__input" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
						</div>
					</div>

					{validation.ok ? null : validation.reason === "no_providers" ? (
						<div className="pur__empty">
							<div className="pur__emptyTitle">No hay proveedores activos.</div>
							<div className="pur__emptySubtitle">Activa o registra proveedores para poder crear compras.</div>
						</div>
					) : validation.reason === "no_products" ? (
						<div className="pur__empty">
							<div className="pur__emptyTitle">No hay productos activos.</div>
							<div className="pur__emptySubtitle">Activa o registra productos para poder crear compras.</div>
						</div>
					) : validation.reason === "no_payment_methods" ? (
						<div className="pur__empty">
							<div className="pur__emptyTitle">No hay formas de pago activas.</div>
							<div className="pur__emptySubtitle">Registra una forma de pago para poder crear compras.</div>
						</div>
					) : null}

					<div className="pur__itemsCard" aria-label="Tabla de productos">
						<div className="pur__itemsHead">
							<div>Producto</div>
							<div>Cantidad</div>
							<div>Costo unitario</div>
							<div className="pur__cellRight">Subtotal</div>
							<div />
						</div>

						{lines.map((l) => (
							<div className="pur__itemsRow" key={l.rowId}>
								<select
									className="pur__select"
									value={l.productoId}
									onChange={(e) => updateLine(l.rowId, { productoId: e.target.value })}
								>
									<option value="" disabled>
										Seleccionar...
									</option>
									{activeProductos.map((p) => (
										<option key={p.id} value={p.id}>
											{p.nombre}
										</option>
									))}
								</select>

								<input
									className="pur__input"
									type="text"
									inputMode="numeric"
									placeholder="0"
									value={l.cantidad}
									onChange={(e) => updateLine(l.rowId, { cantidad: e.target.value })}
								/>

								<input
									className="pur__input"
									type="text"
									inputMode="decimal"
									placeholder="$0"
									value={l.costoUnitario}
									onChange={(e) => updateLine(l.rowId, { costoUnitario: e.target.value })}
								/>

								<div className="pur__cellRight">{formatCurrency(computed.rowSubtotals.get(l.rowId) ?? 0)}</div>

								<SecondaryButton type="button" className="pur__removeBtn" onClick={() => setConfirmRemove({ rowId: l.rowId })}>
									Quitar
								</SecondaryButton>
							</div>
						))}
					</div>

					<div className="pur__addLine">
						<SecondaryButton type="button" onClick={addLine}>
							<Plus size={14} strokeWidth={2.2} />
							<span>Agregar producto</span>
						</SecondaryButton>
					</div>

					{formError ? <div className="pur__formError">{formError}</div> : null}

					<div className="pur__totals">
						<div className="pur__totalBox" aria-label="Total">
							<div className="pur__totalLabel">Total general</div>
							<div className="pur__totalValue">{formatCurrency(computed.total)}</div>
						</div>
					</div>
				</div>
			</Modal>

			<ConfirmDialog
				open={Boolean(confirmRemove)}
				title="Quitar producto"
				message="¿Deseas quitar este producto de la compra?"
				confirmText="Quitar"
				cancelText="Cancelar"
				onConfirm={() => {
					if (!confirmRemove) return;
					removeLine(confirmRemove.rowId);
					setConfirmRemove(null);
				}}
				onCancel={() => setConfirmRemove(null)}
			/>
		</div>
	);
}