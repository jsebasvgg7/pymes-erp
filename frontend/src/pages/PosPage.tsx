import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, ChevronDown, Minus, Package, Plus, Printer, Receipt, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import { authService } from "../services/authService";
import { cajaService } from "../services/cajaService";
import { clienteService, type Cliente } from "../services/clienteService";
import { formaPagoService, type FormaPago } from "../services/formaPagoService";
import { productoService, type Producto } from "../services/ProductoService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import "./PosPage.css";

type CartLine = {
	productId: number;
	quantity: number;
};

type CartItem = CartLine & {
	product: Producto;
};

type SaleReceipt = {
	sale: FacturaVentaResponse;
	received: number;
	change: number;
};

type StockStatus = "ok" | "low" | "out";

const QUICK_BILLS = [5000, 10000, 20000, 50000, 100000];

const UNIT_LABELS: Record<string, [string, string]> = {
	UNIDAD: ["unidad", "unidades"],
	KILOGRAMO: ["kg", "kg"],
	GRAMO: ["g", "g"],
	LITRO: ["litro", "litros"],
	MILILITRO: ["ml", "ml"],
	CAJA: ["caja", "cajas"],
	PAQUETE: ["paquete", "paquetes"]
};

const STATUS_LABELS: Record<StockStatus, string> = {
	ok: "Disponible",
	low: "Stock bajo",
	out: "Agotado"
};

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function formatUnits(stock: number, unidadMedida: string) {
	const labels = UNIT_LABELS[unidadMedida] ?? UNIT_LABELS.UNIDAD;
	return `${stock.toLocaleString("es-CO")} ${stock === 1 ? labels[0] : labels[1]}`;
}

function stockStatus(p: Producto): StockStatus {
	if (p.stockActual <= 0) return "out";
	if (p.stockActual <= p.stockMinimo) return "low";
	return "ok";
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return parts
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? "")
		.join("");
}

function pad2(n: number) {
	return String(n).padStart(2, "0");
}

function isCashMethod(f: FormaPago | undefined) {
	if (!f) return false;
	return (f.tipo ?? "").toUpperCase().includes("EFECTIVO") || f.nombre.toLowerCase().includes("efectivo");
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export default function PosPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [products, setProducts] = useState<Producto[]>([]);
	const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [hasCaja, setHasCaja] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [lines, setLines] = useState<CartLine[]>([]);
	const [formaPagoId, setFormaPagoId] = useState<string>("");
	const [clienteId, setClienteId] = useState<string>("");
	const [receivedDigits, setReceivedDigits] = useState("");

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

	const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
	const [saleError, setSaleError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const orderRef = useRef<HTMLElement | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [productosData, formasPagoData, clientesData, cajas] = await Promise.all([
				productoService.listarPorEmpresa(empresaId, 0, 200),
				formaPagoService.listarPorEmpresa(empresaId, 0, 50),
				clienteService.listarPorEmpresa(empresaId, 0, 200),
				cajaService.listarPorEmpresa(empresaId).catch(() => null)
			]);
			setProducts(productosData.content);
			setFormasPago(formasPagoData.content.filter((f) => f.active));
			setClientes(clientesData.content.filter((c) => c.active));
			setHasCaja(cajas === null ? null : cajas.some((c) => c.active));
			setFormaPagoId((prev) => prev || String(formasPagoData.content.find((f) => f.active)?.id ?? ""));
		} catch {
			setError("No se pudo cargar el punto de venta. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		if (loading) return;
		if (window.matchMedia("(pointer: fine)").matches) searchInputRef.current?.focus();
	}, [loading]);

	const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

	const categories = useMemo(() => {
		const map = new Map<number, string>();
		activeProducts.forEach((p) => {
			if (p.categoriaId && p.categoriaNombre) map.set(p.categoriaId, p.categoriaNombre);
		});
		return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	}, [activeProducts]);

	const filteredProducts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return activeProducts.filter((p) => {
			if (categoryFilter !== null && p.categoriaId !== categoryFilter) return false;
			if (!q) return true;
			return p.nombre.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
		});
	}, [activeProducts, categoryFilter, searchQuery]);

	const cartItems = useMemo<CartItem[]>(() => {
		const byId = new Map(products.map((p) => [p.id, p]));
		return lines.flatMap((l) => {
			const product = byId.get(l.productId);
			return product ? [{ ...l, product }] : [];
		});
	}, [lines, products]);

	const quantityById = useMemo(() => new Map(lines.map((l) => [l.productId, l.quantity])), [lines]);

	const subtotal = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity * i.product.precioVenta, 0), [cartItems]);
	const total = subtotal;
	const unitsCount = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity, 0), [cartItems]);

	const selectedFormaPago = useMemo(() => formasPago.find((f) => String(f.id) === formaPagoId), [formaPagoId, formasPago]);
	const cashPayment = isCashMethod(selectedFormaPago);

	const received = receivedDigits ? Number(receivedDigits) : 0;
	const changeDue = received - total;
	const insufficientCash = cashPayment && received > 0 && received < total;

	const hasInvalidQuantity = cartItems.some((i) => i.quantity < 1);
	const canFinalize =
		cartItems.length > 0 &&
		Boolean(formaPagoId) &&
		!saving &&
		hasCaja !== false &&
		!hasInvalidQuantity &&
		!insufficientCash;

	const addToCart = useCallback((p: Producto) => {
		if (p.stockActual <= 0) return;
		setSaleError(null);
		setLines((prev) => {
			const existing = prev.find((l) => l.productId === p.id);
			if (!existing) return [...prev, { productId: p.id, quantity: 1 }];
			return prev.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(l.quantity + 1, p.stockActual) } : l));
		});
	}, []);

	const setQuantity = useCallback((p: Producto, quantity: number) => {
		const next = Math.max(0, Math.min(quantity, p.stockActual));
		setLines((prev) => prev.map((l) => (l.productId === p.id ? { ...l, quantity: next } : l)));
	}, []);

	const normalizeQuantity = useCallback((productId: number) => {
		setLines((prev) => prev.map((l) => (l.productId === productId && l.quantity < 1 ? { ...l, quantity: 1 } : l)));
	}, []);

	const removeLine = useCallback((productId: number) => {
		setLines((prev) => prev.filter((l) => l.productId !== productId));
	}, []);

	const toggleProduct = useCallback(
		(p: Producto) => {
			if (quantityById.has(p.id)) removeLine(p.id);
			else addToCart(p);
		},
		[addToCart, quantityById, removeLine]
	);

	const resetOrder = useCallback(() => {
		setLines([]);
		setClienteId("");
		setReceivedDigits("");
		setSaleError(null);
	}, []);

	const requestCancel = () => {
		if (lines.length === 0) return;
		setConfirmCancelOpen(true);
	};

	const confirmCancel = () => {
		resetOrder();
		setConfirmCancelOpen(false);
	};

	const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "Enter") return;
		const first = filteredProducts.find((p) => p.stockActual > 0);
		if (!first) return;
		addToCart(first);
		setSearchQuery("");
	};

	const finalizeSale = useCallback(async () => {
		if (!canFinalize || !empresaId) return;

		setSaving(true);
		setSaleError(null);
		try {
			const created = await ventaService.crear({
				empresaId,
				clienteId: clienteId ? Number(clienteId) : undefined,
				formaPagoId: Number(formaPagoId),
				detalles: cartItems.map((i) => ({
					productoId: i.productId,
					descripcion: i.product.nombre,
					cantidad: i.quantity,
					precioUnitario: i.product.precioVenta
				}))
			});

			setReceipt({
				sale: created,
				received: cashPayment ? received : 0,
				change: cashPayment && received >= created.total ? received - created.total : 0
			});
			resetOrder();

			productoService
				.listarPorEmpresa(empresaId, 0, 200)
				.then((data) => setProducts(data.content))
				.catch(() => {});
		} catch (err) {
			setSaleError(extractErrorMessage(err, "No se pudo registrar la venta. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	}, [canFinalize, cartItems, cashPayment, clienteId, empresaId, formaPagoId, received, resetOrder]);

	const closeReceipt = () => {
		setReceipt(null);
		if (window.matchMedia("(pointer: fine)").matches) searchInputRef.current?.focus();
	};

	const scrollToOrder = () => {
		orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	if (loading) {
		return (
			<div className="pos">
				<LoadingState label="Cargando punto de venta..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="pos">
				<div className="pos__state pos__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="pos">
			<header className="pos__header">
				<div className="pos__heading">
					<h1 className="pos__title">Punto de venta (POS)</h1>
					<p className="pos__subtitle">Registro de ventas rápidas y emisión de recibos</p>
				</div>
			</header>

			{hasCaja === false ? (
				<div className="pos__alert" role="alert">
					<AlertTriangle size={16} strokeWidth={2} />
					<span>
						No hay una caja activa para tu empresa, por lo que no se pueden registrar ventas. Crea o activa una desde{" "}
						<Link to="/caja">Caja</Link>.
					</span>
				</div>
			) : null}

			<div className="pos__layout">
				<section className="pos__catalog" aria-label="Catálogo de productos">
					<div className="pos__sectionHead">
						<h2 className="pos__sectionTitle">
							<Package size={18} strokeWidth={2} />
							<span>Productos</span>
						</h2>
						<div className="pos__search">
							<SearchBar
								placeholder="Buscar producto o SKU..."
								value={searchQuery}
								onChange={setSearchQuery}
								onKeyDown={handleSearchKey}
								inputRef={searchInputRef}
							/>
						</div>
					</div>

					{categories.length > 1 ? (
						<div className="pos__chips" role="group" aria-label="Filtrar por categoría">
							<button
								type="button"
								className="pos__chip"
								aria-pressed={categoryFilter === null}
								onClick={() => setCategoryFilter(null)}
							>
								Todos
							</button>
							{categories.map((c) => (
								<button
									key={c.id}
									type="button"
									className="pos__chip"
									aria-pressed={categoryFilter === c.id}
									onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
								>
									{c.nombre}
								</button>
							))}
						</div>
					) : null}

					{activeProducts.length === 0 ? (
						<div className="pos__empty">
							<div className="pos__emptyTitle">No hay productos registrados.</div>
							<div className="pos__emptySubtitle">Crea productos para comenzar a vender.</div>
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="pos__empty">
							<div className="pos__emptyTitle">No se encontraron productos.</div>
							<div className="pos__emptySubtitle">Prueba con otra búsqueda o categoría.</div>
						</div>
					) : (
						<ul className="pos__list">
							{filteredProducts.map((p) => {
								const qty = quantityById.get(p.id);
								const inCart = qty !== undefined;
								const status = stockStatus(p);
								const atMax = inCart && qty >= p.stockActual;
								return (
									<li key={p.id} className={`pos__row${inCart ? " pos__row--selected" : ""}${status === "out" ? " pos__row--out" : ""}`}>
										<button
											type="button"
											className="pos__select"
											role="checkbox"
											aria-checked={inCart}
											aria-label={`${inCart ? "Quitar" : "Agregar"} ${p.nombre}`}
											disabled={status === "out"}
											onClick={() => toggleProduct(p)}
										>
											{inCart ? <Check size={12} strokeWidth={3} /> : null}
										</button>

										<button
											type="button"
											className="pos__rowMain"
											disabled={status === "out"}
											onClick={() => addToCart(p)}
										>
											<span className="pos__tile" aria-hidden="true">
												{initials(p.nombre)}
											</span>
											<span className="pos__info">
												{p.categoriaNombre ? <span className="pos__tag">{p.categoriaNombre}</span> : null}
												<span className="pos__name">{p.nombre}</span>
												<span className="pos__meta">
													<span>Stock: {formatUnits(p.stockActual, p.unidadMedida)}</span>
													<span className={`pos__status pos__status--${status}`}>Estado: {STATUS_LABELS[status]}</span>
												</span>
											</span>
										</button>

										<div className="pos__side">
											<span className="pos__price">{formatCurrency(p.precioVenta)}</span>
											{inCart ? (
												<div className="pos__controls">
													<button
														type="button"
														className="pos__ctrl pos__ctrl--trash"
														aria-label={`Quitar ${p.nombre} del pedido`}
														onClick={() => removeLine(p.id)}
													>
														<Trash2 size={13} strokeWidth={2} />
													</button>
													<button
														type="button"
														className="pos__ctrl"
														aria-label="Disminuir cantidad"
														disabled={qty <= 1}
														onClick={() => setQuantity(p, qty - 1)}
													>
														<Minus size={13} strokeWidth={2.2} />
													</button>
													<input
														className="pos__qty"
														type="text"
														inputMode="numeric"
														aria-label={`Cantidad de ${p.nombre}`}
														value={qty === 0 ? "" : qty}
														onChange={(e) => setQuantity(p, Number(e.target.value.replace(/\D/g, "")))}
														onBlur={() => normalizeQuantity(p.id)}
														onFocus={(e) => e.target.select()}
													/>
													<button
														type="button"
														className="pos__ctrl"
														aria-label="Aumentar cantidad"
														disabled={atMax}
														title={atMax ? "Stock máximo alcanzado" : undefined}
														onClick={() => setQuantity(p, qty + 1)}
													>
														<Plus size={13} strokeWidth={2.2} />
													</button>
												</div>
											) : null}
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</section>

				<aside className="pos__order" ref={orderRef} aria-label="Venta actual">
					<h2 className="pos__sectionTitle pos__sectionTitle--order">Venta actual</h2>

					<div className="pos__card">
						{cartItems.length === 0 ? (
							<div className="pos__empty pos__empty--card">
								<div className="pos__emptyTitle">Sin productos en el pedido.</div>
								<div className="pos__emptySubtitle">Selecciona productos de la lista para iniciar.</div>
							</div>
						) : (
							<>
								<div className="pos__line pos__line--head">
									<span>Total productos</span>
									<span className="pos__num">
										{pad2(unitsCount)} {unitsCount === 1 ? "producto" : "productos"}
									</span>
								</div>
								<ul className="pos__lines">
									{cartItems.map((i) => (
										<li key={i.productId} className="pos__line">
											<span className="pos__lineName">
												{i.product.nombre}
												{i.quantity > 1 ? <span className="pos__lineQty"> ×{i.quantity}</span> : null}
											</span>
											<span className="pos__num">{formatCurrency(i.quantity * i.product.precioVenta)}</span>
										</li>
									))}
								</ul>
								<div className="pos__line pos__line--sub">
									<span>Subtotal</span>
									<span className="pos__num">{formatCurrency(subtotal)}</span>
								</div>
							</>
						)}

						<div className="pos__divider" />

						<div className="pos__line">
							<label htmlFor="pos-cliente">Cliente</label>
							<div className="pos__pill">
								<select id="pos-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
									<option value="">Sin cliente</option>
									{clientes.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nombre}
										</option>
									))}
								</select>
								<ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
							</div>
						</div>
						{clienteId ? <p className="pos__hint">Se creará una cuenta por cobrar para este cliente.</p> : null}

						<div className="pos__line">
							<label htmlFor="pos-pago">Método de pago</label>
							<div className="pos__pill">
								<select id="pos-pago" value={formaPagoId} onChange={(e) => setFormaPagoId(e.target.value)}>
									{formasPago.length === 0 ? <option value="">Sin formas de pago</option> : null}
									{formasPago.map((f) => (
										<option key={f.id} value={f.id}>
											{f.nombre}
										</option>
									))}
								</select>
								<ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
							</div>
						</div>

						{cashPayment && cartItems.length > 0 ? (
							<div className="pos__cash">
								<div className="pos__line">
									<label htmlFor="pos-recibido">Recibido</label>
									<input
										id="pos-recibido"
										className="pos__received"
										type="text"
										inputMode="numeric"
										placeholder="$ 0"
										value={receivedDigits ? Number(receivedDigits).toLocaleString("es-CO") : ""}
										onChange={(e) => setReceivedDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
									/>
								</div>
								<div className="pos__bills">
									<button type="button" className="pos__chip pos__chip--sm" onClick={() => setReceivedDigits(String(total))}>
										Exacto
									</button>
									{QUICK_BILLS.map((b) => (
										<button
											key={b}
											type="button"
											className="pos__chip pos__chip--sm"
											onClick={() => setReceivedDigits(String(b))}
										>
											{b.toLocaleString("es-CO")}
										</button>
									))}
								</div>
								{received > 0 ? (
									<div className={`pos__line pos__line--change${insufficientCash ? " pos__line--danger" : ""}`}>
										<span>{insufficientCash ? "Faltan" : "Cambio"}</span>
										<span className="pos__num">{formatCurrency(Math.abs(changeDue))}</span>
									</div>
								) : null}
							</div>
						) : null}

						<div className="pos__line pos__line--total" aria-live="polite">
							<span>Total</span>
							<span className="pos__num">{formatCurrency(total)}</span>
						</div>
					</div>

					{saleError ? (
						<div className="pos__formError" role="alert">
							{saleError}
						</div>
					) : null}

					<div className="pos__ctas">
						<PrimaryButton type="button" className="pos__cta" onClick={finalizeSale} disabled={!canFinalize}>
							{saving ? "Procesando..." : "Finalizar venta"}
						</PrimaryButton>
						<SecondaryButton
							type="button"
							className="pos__cta pos__cta--ghost"
							onClick={requestCancel}
							disabled={saving || lines.length === 0}
						>
							Cancelar
						</SecondaryButton>
					</div>
				</aside>
			</div>

			{cartItems.length > 0 ? (
				<div className="pos__mobileBar">
					<div className="pos__mobileTotal">
						<span>{pad2(unitsCount)} productos</span>
						<strong className="pos__num">{formatCurrency(total)}</strong>
					</div>
					<PrimaryButton type="button" className="pos__mobileBtn" onClick={scrollToOrder}>
						Ver pedido
					</PrimaryButton>
				</div>
			) : null}

			<Modal
				open={receipt !== null}
				title={
					<div className="pos__modalHead">
						<div className="pos__modalTitle">
							<Receipt size={20} strokeWidth={2} />
							<span>Venta registrada</span>
						</div>
						<p className="pos__modalSubtitle">{receipt ? `Recibo ${receipt.sale.numero}` : ""}</p>
					</div>
				}
				onClose={closeReceipt}
				footer={
					<div className="pos__modalActions">
						<SecondaryButton type="button" onClick={() => window.print()}>
							<Printer size={14} strokeWidth={2} />
							<span>Imprimir</span>
						</SecondaryButton>
						<PrimaryButton type="button" onClick={closeReceipt}>
							Nueva venta
						</PrimaryButton>
					</div>
				}
			>
				{receipt ? (
					<div className="pos__ticket">
						<div className="pos__ticketMeta">
							<div>
								<span>Fecha</span>
								<strong>{formatDateTime(receipt.sale.fechaEmision)}</strong>
							</div>
							<div>
								<span>Método de pago</span>
								<strong>{receipt.sale.formaPagoNombre}</strong>
							</div>
							{receipt.sale.clienteNombre ? (
								<div>
									<span>Cliente</span>
									<strong>{receipt.sale.clienteNombre}</strong>
								</div>
							) : null}
						</div>

						<ul className="pos__ticketItems">
							{receipt.sale.detalles.map((d) => (
								<li key={d.id}>
									<span>
										{d.cantidad} × {d.productoNombre || d.descripcion}
									</span>
									<span className="pos__num">{formatCurrency(d.totalLinea)}</span>
								</li>
							))}
						</ul>

						<div className="pos__ticketTotals">
							<div>
								<span>Subtotal</span>
								<span className="pos__num">{formatCurrency(receipt.sale.subtotal)}</span>
							</div>
							<div className="pos__ticketTotal">
								<span>Total</span>
								<span className="pos__num">{formatCurrency(receipt.sale.total)}</span>
							</div>
							{receipt.received > 0 ? (
								<>
									<div>
										<span>Recibido</span>
										<span className="pos__num">{formatCurrency(receipt.received)}</span>
									</div>
									<div>
										<span>Cambio</span>
										<span className="pos__num">{formatCurrency(receipt.change)}</span>
									</div>
								</>
							) : null}
						</div>
					</div>
				) : null}
			</Modal>

			<ConfirmDialog
				open={confirmCancelOpen}
				title="Cancelar pedido"
				message="¿Deseas vaciar el pedido actual? Se quitarán todos los productos seleccionados."
				confirmText="Vaciar pedido"
				cancelText="Volver"
				onConfirm={confirmCancel}
				onCancel={() => setConfirmCancelOpen(false)}
			/>
		</div>
	);
}