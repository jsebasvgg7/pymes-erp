import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import { authService } from "../services/authService";
import { clienteService, type Cliente } from "../services/clienteService";
import { formaPagoService, type FormaPago } from "../services/formaPagoService";
import { productoService, type Producto } from "../services/ProductoService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import "./PosPage.css";

type CartItem = {
	productId: number;
	name: string;
	price: number;
	quantity: number;
	stock: number;
};

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [cart, setCart] = useState<CartItem[]>([]);
	const [formaPagoId, setFormaPagoId] = useState<string>("");
	const [clienteId, setClienteId] = useState<string>("");

	const [receiptOpen, setReceiptOpen] = useState(false);
	const [lastSale, setLastSale] = useState<FacturaVentaResponse | null>(null);

	const [saleErrorOpen, setSaleErrorOpen] = useState(false);
	const [saleErrorMessage, setSaleErrorMessage] = useState<string>("");
	const [saving, setSaving] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [productosData, formasPagoData, clientesData] = await Promise.all([
				productoService.listarPorEmpresa(empresaId, 0, 200),
				formaPagoService.listarPorEmpresa(empresaId, 0, 50),
				clienteService.listarPorEmpresa(empresaId, 0, 200)
			]);
			setProducts(productosData.content);
			setFormasPago(formasPagoData.content.filter((f) => f.active));
			setClientes(clientesData.content.filter((c) => c.active));
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
		const el = searchRef.current;
		if (!el) return;

		const input = el.querySelector("input");
		if (!input) return;

		const onInput = (e: Event) => {
			const target = e.target as HTMLInputElement | null;
			setSearchQuery(target?.value ?? "");
		};

		input.addEventListener("input", onInput);
		return () => {
			input.removeEventListener("input", onInput);
		};
	}, []);

	const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

	const filteredProducts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return activeProducts;
		return activeProducts.filter((p) => p.nombre.toLowerCase().includes(q));
	}, [activeProducts, searchQuery]);

	const addToCart = (p: Producto) => {
		setCart((prev) => {
			const idx = prev.findIndex((i) => i.productId === p.id);
			if (idx === -1) {
				return [
					...prev,
					{
						productId: p.id,
						name: p.nombre,
						price: p.precioVenta,
						quantity: 1,
						stock: p.stockActual
					}
				];
			}

			return prev.map((i) => (i.productId !== p.id ? i : { ...i, quantity: i.quantity + 1 }));
		});
	};

	const incQty = (productId: number) => {
		setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)));
	};

	const decQty = (productId: number) => {
		setCart((prev) =>
			prev.map((i) => (i.productId !== productId ? i : { ...i, quantity: Math.max(1, i.quantity - 1) }))
		);
	};

	const removeItem = (productId: number) => {
		setCart((prev) => prev.filter((i) => i.productId !== productId));
	};

	const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.quantity * i.price, 0), [cart]);
	const total = subtotal;

	const cancelOrder = () => {
		setCart([]);
		setClienteId("");
	};

	const canFinalize = cart.length > 0 && Boolean(formaPagoId) && !saving;

	const finalizeSale = useCallback(async () => {
		if (!canFinalize || !empresaId) return;

		const insufficient = cart.filter((i) => i.stock < i.quantity);
		if (insufficient.length > 0) {
			const message = insufficient
				.map((x) => `Stock insuficiente para "${x.name}". Disponible: ${x.stock}. Solicitado: ${x.quantity}.`)
				.join("\n");
			setSaleErrorMessage(message);
			setSaleErrorOpen(true);
			return;
		}

		setSaving(true);
		try {
			const created = await ventaService.crear({
				empresaId,
				clienteId: clienteId ? Number(clienteId) : undefined,
				formaPagoId: Number(formaPagoId),
				detalles: cart.map((i) => ({
					productoId: i.productId,
					descripcion: i.name,
					cantidad: i.quantity,
					precioUnitario: i.price
				}))
			});

			setLastSale(created);
			setReceiptOpen(true);
			cancelOrder();

			// Refrescar productos: el backend ajustó el stock al crear la factura.
			productoService
				.listarPorEmpresa(empresaId, 0, 200)
				.then((data) => setProducts(data.content))
				.catch(() => {});
		} catch (err) {
			setSaleErrorMessage(extractErrorMessage(err, "No se pudo registrar la venta. Intenta nuevamente."));
			setSaleErrorOpen(true);
		} finally {
			setSaving(false);
		}
	}, [canFinalize, cart, clienteId, empresaId, formaPagoId]);

	if (loading) {
		return (
			<div className="posWrap">
				<LoadingState label="Cargando punto de venta..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="posWrap">
				<div className="pos__state pos__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="posWrap">
			<PageHeader title="Punto de Venta (POS)" subtitle="Ventas rápidas y preparadas para pantalla táctil." />

			<div className="pos">
				<section className="pos__left">
					<div className="pos__panel">
						<div className="pos__panelHeader">
							<div className="pos__panelTitle">Productos</div>
							<div ref={searchRef} style={{ minWidth: 260 }}>
								<SearchBar placeholder="Buscar producto..." />
							</div>
						</div>
						<div className="pos__panelBody">
							{activeProducts.length === 0 ? (
								<div className="pos__empty">
									<div className="pos__emptyTitle">No hay productos registrados.</div>
									<div className="pos__emptySubtitle">Crea productos para comenzar a vender.</div>
								</div>
							) : (
								<div className="pos__productsGrid">
									{filteredProducts.map((p) => (
										<div key={p.id} className="pos__productCard">
											<div className="pos__productTop">
												<div className="pos__productImg" aria-hidden="true" />
												<div className="pos__productName">{p.nombre}</div>
											</div>

											<div className="pos__productMeta">
												<div className="pos__productPrice">{formatCurrency(p.precioVenta)}</div>
												<div className="pos__productStock">Stock: {p.stockActual.toLocaleString("es-CO")}</div>
											</div>

											<div className="pos__productActions">
												<PrimaryButton type="button" onClick={() => addToCart(p)} disabled={p.stockActual <= 0}>
													Agregar
												</PrimaryButton>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</section>

				<section className="pos__right">
					<div className="pos__panel">
						<div className="pos__panelHeader">
							<div className="pos__panelTitle">Pedido</div>
						</div>
						<div className="pos__panelBody">
							{cart.length === 0 ? (
								<div className="pos__empty">
									<div className="pos__emptyTitle">Sin productos en el pedido.</div>
									<div className="pos__emptySubtitle">Agrega productos desde la izquierda para iniciar.</div>
								</div>
							) : (
								<div className="pos__cartTable" role="table" aria-label="Resumen del pedido">
									<div className="pos__cartHead" role="row">
										<div>Producto</div>
										<div>Cant.</div>
										<div className="pos__cellRight">Precio</div>
										<div className="pos__cellRight">Subtotal</div>
										<div />
									</div>

									{cart.map((i) => (
										<div className="pos__cartRow" role="row" key={i.productId}>
											<div className="pos__cartName">{i.name}</div>
											<div className="pos__cartQty">
												<SecondaryButton type="button" className="pos__qtyBtn" onClick={() => decQty(i.productId)}>
													-
												</SecondaryButton>
												<div className="pos__qtyValue">{i.quantity}</div>
												<SecondaryButton type="button" className="pos__qtyBtn" onClick={() => incQty(i.productId)}>
													+
												</SecondaryButton>
											</div>
											<div className="pos__cellRight">{formatCurrency(i.price)}</div>
											<div className="pos__cellRight">{formatCurrency(i.quantity * i.price)}</div>
											<SecondaryButton type="button" className="pos__removeBtn" onClick={() => removeItem(i.productId)}>
												Eliminar
											</SecondaryButton>
										</div>
									))}
								</div>
							)}

							<div className="pos__totals">
								<div className="pos__totalRow">
									<span>Subtotal</span>
									<span className="pos__totalValue">{formatCurrency(subtotal)}</span>
								</div>
								<div className="pos__totalRow">
									<span>Total</span>
									<span className="pos__totalValue">{formatCurrency(total)}</span>
								</div>
							</div>

							<div className="pos__pay">
								<label className="pos__label">Cliente (opcional)</label>
								<select className="pos__select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
									<option value="">Sin cliente</option>
									{clientes.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nombre}
										</option>
									))}
								</select>
							</div>

							<div className="pos__pay">
								<label className="pos__label">Método de pago</label>
								<select className="pos__select" value={formaPagoId} onChange={(e) => setFormaPagoId(e.target.value)}>
									{formasPago.length === 0 ? <option value="">Sin formas de pago</option> : null}
									{formasPago.map((f) => (
										<option key={f.id} value={f.id}>
											{f.nombre}
										</option>
									))}
								</select>
							</div>

							<div className="pos__actions">
								<SecondaryButton type="button" onClick={cancelOrder} disabled={saving}>
									Cancelar
								</SecondaryButton>
								<PrimaryButton type="button" onClick={finalizeSale} disabled={!canFinalize}>
									{saving ? "Procesando..." : "Finalizar Venta"}
								</PrimaryButton>
							</div>
						</div>
					</div>
				</section>
			</div>

			<Modal
				open={receiptOpen}
				title={lastSale ? `Recibo — Venta ${lastSale.numero}` : "Recibo"}
				onClose={() => setReceiptOpen(false)}
				footer={
					<div className="pos__receiptActions">
						<SecondaryButton type="button" onClick={() => setReceiptOpen(false)}>
							Cerrar
						</SecondaryButton>
						<PrimaryButton type="button">Imprimir</PrimaryButton>
					</div>
				}
			>
				{lastSale ? (
					<div className="pos__receipt">
						<div className="pos__receiptMeta">
							<div className="pos__receiptLine">
								<div className="pos__receiptLabel">Fecha</div>
								<div className="pos__receiptValue">{formatDateTime(lastSale.fechaEmision)}</div>
							</div>
							<div className="pos__receiptLine">
								<div className="pos__receiptLabel">Método de pago</div>
								<div className="pos__receiptValue">{lastSale.formaPagoNombre}</div>
							</div>
							{lastSale.clienteNombre ? (
								<div className="pos__receiptLine">
									<div className="pos__receiptLabel">Cliente</div>
									<div className="pos__receiptValue">{lastSale.clienteNombre}</div>
								</div>
							) : null}
						</div>

						<div className="pos__receiptLine">
							<div className="pos__receiptLabel">Productos</div>
							<div className="pos__receiptItems">
								{lastSale.detalles.map((d) => (
									<div className="pos__receiptItem" key={d.id}>
										<span>
											{d.cantidad} × {d.productoNombre || d.descripcion}
										</span>
										<span>{formatCurrency(d.totalLinea)}</span>
									</div>
								))}
								<div className="pos__receiptTotal">
									<span>Total</span>
									<span>{formatCurrency(lastSale.total)}</span>
								</div>
							</div>
						</div>
					</div>
				) : null}
			</Modal>

			<Modal
				open={saleErrorOpen}
				title="No se pudo completar la venta"
				onClose={() => setSaleErrorOpen(false)}
				footer={
					<div className="pos__receiptActions">
						<PrimaryButton type="button" onClick={() => setSaleErrorOpen(false)}>
							Cerrar
						</PrimaryButton>
					</div>
				}
			>
				<div className="pos__empty">
					<div className="pos__emptyTitle">Revisa el pedido e intenta de nuevo.</div>
					<div className="pos__emptySubtitle">
						{saleErrorMessage.split("\n").map((line, idx) => (
							<div key={idx}>{line}</div>
						))}
					</div>
				</div>
			</Modal>
		</div>
	);
}