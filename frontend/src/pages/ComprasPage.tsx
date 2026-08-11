import { useCallback, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { getProducts, saveProducts, type Product } from "../services/productStorage";
import { getProviders, type Provider } from "../services/providerStorage";
import { addPurchase, getPurchases, type Purchase } from "../services/purchaseStorage";
import "./ComprasPage.css";

type PurchaseLine = {
	rowId: string;
	productId: string;
	quantity: string;
	purchasePrice: string;
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
	const d = new Date(`${value}T00:00:00`);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-CO");
}

export default function ComprasPage() {
	const [modalOpen, setModalOpen] = useState(false);
	const [providerId, setProviderId] = useState("");
	const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [lines, setLines] = useState<PurchaseLine[]>([]);
	const [confirmRemove, setConfirmRemove] = useState<ConfirmRemove>(null);

	const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());

	const activeProducts = useMemo(() => getProducts().filter((p) => p.estado === "Activo"), []);
	const activeProviders = useMemo(() => getProviders().filter((p) => p.estado === "Activo"), []);

	const providerById = useMemo(() => {
		const map = new Map<string, Provider>();
		activeProviders.forEach((p) => map.set(p.id, p));
		return map;
	}, [activeProviders]);

	const productById = useMemo(() => {
		const map = new Map<string, Product>();
		activeProducts.forEach((p) => map.set(p.id, p));
		return map;
	}, [activeProducts]);

	const openModal = useCallback(() => {
		setProviderId("");
		setPurchaseDate(new Date().toISOString().slice(0, 10));
		setLines([]);
		setModalOpen(true);
	}, []);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setConfirmRemove(null);
	}, []);

	const addLine = useCallback(() => {
		setLines((prev) => [
			...prev,
			{
				rowId: generateRowId(),
				productId: "",
				quantity: "",
				purchasePrice: ""
			}
		]);
	}, []);

	const removeLine = useCallback((rowId: string) => {
		setLines((prev) => prev.filter((l) => l.rowId !== rowId));
	}, []);

	const updateLine = useCallback(
		(rowId: string, patch: Partial<Pick<PurchaseLine, "productId" | "quantity" | "purchasePrice">>) => {
			setLines((prev) =>
				prev.map((l) => {
					if (l.rowId !== rowId) return l;

					const next: PurchaseLine = { ...l, ...patch };
					if (patch.productId && patch.productId !== l.productId) {
						const p = productById.get(patch.productId);
						if (p) {
							next.purchasePrice = String(p.precioCompra);
							next.quantity = next.quantity || "1";
						}
					}

					return next;
				})
			);
		},
		[productById]
	);

	const computed = useMemo(() => {
		const rowSubtotals = new Map<string, number>();
		let total = 0;

		lines.forEach((l) => {
			const qty = parseIntegerInput(l.quantity);
			const price = parseDecimalInput(l.purchasePrice);
			const subtotal = qty > 0 && price > 0 ? qty * price : 0;
			rowSubtotals.set(l.rowId, subtotal);
			total += subtotal;
		});

		return { rowSubtotals, total };
	}, [lines]);

	const validation = useMemo(() => {
		if (activeProviders.length === 0) return { ok: false, reason: "no_providers" as const };
		if (activeProducts.length === 0) return { ok: false, reason: "no_products" as const };
		if (!providerId) return { ok: false, reason: "missing_provider" as const };
		if (lines.length === 0) return { ok: false, reason: "no_lines" as const };

		const hasInvalid = lines.some((l) => {
			const qty = parseIntegerInput(l.quantity);
			const price = parseDecimalInput(l.purchasePrice);
			return !l.productId || qty <= 0 || price <= 0;
		});

		if (hasInvalid) return { ok: false, reason: "invalid_lines" as const };

		return { ok: true as const };
	}, [activeProducts.length, activeProviders.length, lines, providerId]);

	const handleSave = useCallback(() => {
		if (!validation.ok) return;

		const provider = providerById.get(providerId);
		if (!provider) return;

		const items = lines.map((l) => {
			const product = productById.get(l.productId);
			return {
				productId: l.productId,
				productName: product?.nombre ?? "Producto",
				quantity: parseIntegerInput(l.quantity),
				purchasePrice: parseDecimalInput(l.purchasePrice)
			};
		});

		const created = addPurchase({
			providerId: provider.id,
			providerName: provider.empresa,
			date: purchaseDate,
			items
		});

		const purchasedQtyByProductId = new Map<string, number>();
		items.forEach((i) => {
			purchasedQtyByProductId.set(i.productId, (purchasedQtyByProductId.get(i.productId) ?? 0) + i.quantity);
		});

		const currentProducts = getProducts();
		let changed = false;
		const nextProducts = currentProducts.map((p) => {
			const inc = purchasedQtyByProductId.get(p.id);
			if (!inc) return p;
			changed = true;
			return { ...p, stock: p.stock + inc };
		});
		if (changed) saveProducts(nextProducts);

		setPurchases((prev) => [...prev, created]);
		closeModal();
	}, [closeModal, lines, productById, providerById, providerId, purchaseDate, validation.ok]);

	const listColumns: Array<DataTableColumn<Purchase>> = useMemo(
		() => [
			{ key: "number", header: "Número", render: (r) => `#${r.number}` },
			{ key: "provider", header: "Proveedor", render: (r) => r.providerName },
			{ key: "date", header: "Fecha", render: (r) => formatDateLabel(r.date) },
			{ key: "items", header: "Cantidad de productos", align: "right", render: (r) => r.totalQuantity.toLocaleString("es-CO") },
			{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) }
		],
		[]
	);

	return (
		<div className="pur">
			<PageHeader
				title="Compras"
				subtitle="Registro de compras a proveedores."
				actions={
					<PrimaryButton type="button" onClick={openModal}>
						Nueva Compra
					</PrimaryButton>
				}
			/>

			<div className="pur__list">
				<DataTable
					columns={listColumns}
					data={purchases}
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
				title="Nueva Compra"
				onClose={closeModal}
				footer={
					<div className="pur__modalActions">
						<SecondaryButton type="button" onClick={closeModal}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!validation.ok}>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				<div className="pur__invoice">
					<div className="pur__topGrid">
						<div className="pur__field">
							<label className="pur__label">Proveedor</label>
							<select className="pur__select" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
								<option value="" disabled>
									Seleccionar...
								</option>
								{activeProviders.map((p) => (
									<option key={p.id} value={p.id}>
										{p.empresa}
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
					) : null}

					<div className="pur__itemsCard" aria-label="Tabla de productos">
						<div className="pur__itemsHead">
							<div>Producto</div>
							<div>Cantidad</div>
							<div>Precio compra</div>
							<div className="pur__cellRight">Subtotal</div>
							<div />
						</div>

						{lines.map((l) => (
							<div className="pur__itemsRow" key={l.rowId}>
								<select
									className="pur__select"
									value={l.productId}
									onChange={(e) => updateLine(l.rowId, { productId: e.target.value })}
								>
									<option value="" disabled>
										Seleccionar...
									</option>
									{activeProducts.map((p) => (
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
									value={l.quantity}
									onChange={(e) => updateLine(l.rowId, { quantity: e.target.value })}
								/>

								<input
									className="pur__input"
									type="text"
									inputMode="decimal"
									placeholder="$0"
									value={l.purchasePrice}
									onChange={(e) => updateLine(l.rowId, { purchasePrice: e.target.value })}
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
							+ Agregar Producto
						</SecondaryButton>
					</div>

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
