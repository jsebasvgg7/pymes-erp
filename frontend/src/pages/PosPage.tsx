import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import { addCashMovement } from "../services/cashStorage";
import { getProducts, saveProducts, type Product } from "../services/productStorage";
import { addSale, type PaymentMethod, type Sale } from "../services/salesStorage";
import "./PosPage.css";

type CartItem = {
	productId: string;
	name: string;
	price: number;
	quantity: number;
	stock: number;
	image?: string;
};

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

export default function PosPage() {
	const [products, setProducts] = useState<Product[]>(() => getProducts().filter((p) => p.estado === "Activo"));
	const [cart, setCart] = useState<CartItem[]>([]);
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Efectivo");
	const [receiptOpen, setReceiptOpen] = useState(false);
	const [lastSale, setLastSale] = useState<Sale | null>(null);
	const [stockErrorOpen, setStockErrorOpen] = useState(false);
	const [stockErrorMessage, setStockErrorMessage] = useState<string>("");

	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef<HTMLDivElement | null>(null);

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

	const filteredProducts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return products;
		return products.filter((p) => p.nombre.toLowerCase().includes(q));
	}, [products, searchQuery]);

	const addToCart = (p: Product) => {
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
						stock: p.stock,
						image: p.imagen
					}
				];
			}

			return prev.map((i) => {
				if (i.productId !== p.id) return i;
				return { ...i, quantity: i.quantity + 1 };
			});
		});
	};

	const incQty = (productId: string) => {
		setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)));
	};

	const decQty = (productId: string) => {
		setCart((prev) =>
			prev.map((i) => {
				if (i.productId !== productId) return i;
				return { ...i, quantity: Math.max(1, i.quantity - 1) };
			})
		);
	};

	const removeItem = (productId: string) => {
		setCart((prev) => prev.filter((i) => i.productId !== productId));
	};

	const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.quantity * i.price, 0), [cart]);
	const total = subtotal;

	const cancelOrder = () => {
		setCart([]);
		setPaymentMethod("Efectivo");
	};

	const canFinalize = cart.length > 0;

	const finalizeSale = () => {
		if (!canFinalize) return;

		const qtyByProductId = new Map<string, number>();
		cart.forEach((i) => qtyByProductId.set(i.productId, (qtyByProductId.get(i.productId) ?? 0) + i.quantity));

		const currentProducts = getProducts();
		const productById = new Map<string, Product>();
		currentProducts.forEach((p) => productById.set(p.id, p));

		const insufficient: Array<{ name: string; available: number; requested: number }> = [];
		qtyByProductId.forEach((requested, productId) => {
			const p = productById.get(productId);
			const available = p?.stock ?? 0;
			if (available < requested) {
				insufficient.push({ name: p?.nombre ?? "Producto", available, requested });
			}
		});

		if (insufficient.length > 0) {
			const message = insufficient
				.map((x) => `Stock insuficiente para "${x.name}". Disponible: ${x.available}. Solicitado: ${x.requested}.`)
				.join("\n");
			setStockErrorMessage(message);
			setStockErrorOpen(true);
			return;
		}

		const sale = addSale({
			paymentMethod,
			items: cart.map((i) => ({
				productId: i.productId,
				productName: i.name,
				quantity: i.quantity,
				unitPrice: i.price
			}))
		});

		let changed = false;
		const nextProducts = currentProducts.map((p) => {
			const dec = qtyByProductId.get(p.id);
			if (!dec) return p;
			changed = true;
			return { ...p, stock: p.stock - dec };
		});
		if (changed) {
			saveProducts(nextProducts);
			setProducts(nextProducts.filter((p) => p.estado === "Activo"));
		}

		addCashMovement({
			tipo: "Ingreso",
			concepto: `Venta POS #${String(sale.number).padStart(6, "0")}`,
			valor: sale.total,
			observacion: "Venta registrada automáticamente desde Punto de Venta."
		});

		setLastSale(sale);
		setReceiptOpen(true);
		cancelOrder();
	};

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
							{products.length === 0 ? (
								<div className="pos__empty">
									<div className="pos__emptyTitle">No hay productos registrados.</div>
									<div className="pos__emptySubtitle">Crea productos para comenzar a vender.</div>
								</div>
							) : (
								<div className="pos__productsGrid">
									{filteredProducts.map((p) => (
										<div key={p.id} className="pos__productCard">
											<div className="pos__productTop">
												<div
													className="pos__productImg"
													aria-hidden="true"
													style={p.imagen ? { backgroundImage: `url(${p.imagen})` } : undefined}
												/>
												<div className="pos__productName">{p.nombre}</div>
											</div>

											<div className="pos__productMeta">
												<div className="pos__productPrice">{formatCurrency(p.precioVenta)}</div>
												<div className="pos__productStock">Stock: {p.stock.toLocaleString("es-CO")}</div>
											</div>

											<div className="pos__productActions">
												<PrimaryButton type="button" onClick={() => addToCart(p)}>
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
								<label className="pos__label">Método de pago</label>
								<select className="pos__select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
									<option value="Efectivo">Efectivo</option>
									<option value="Tarjeta">Tarjeta</option>
									<option value="Transferencia">Transferencia</option>
								</select>
							</div>

							<div className="pos__actions">
								<SecondaryButton type="button" onClick={cancelOrder}>
									Cancelar
								</SecondaryButton>
								<PrimaryButton type="button" onClick={finalizeSale} disabled={!canFinalize}>
									Finalizar Venta
								</PrimaryButton>
							</div>
						</div>
					</div>
				</section>
			</div>

			<Modal
				open={receiptOpen}
				title={lastSale ? `Recibo — Venta #${lastSale.number}` : "Recibo"}
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
								<div className="pos__receiptValue">{formatDateTime(lastSale.date)}</div>
							</div>
							<div className="pos__receiptLine">
								<div className="pos__receiptLabel">Método de pago</div>
								<div className="pos__receiptValue">{lastSale.paymentMethod}</div>
							</div>
						</div>

						<div className="pos__receiptLine">
							<div className="pos__receiptLabel">Productos</div>
							<div className="pos__receiptItems">
								{lastSale.items.map((i) => (
									<div className="pos__receiptItem" key={i.productId}>
										<span>
											{i.quantity} × {i.productName}
										</span>
										<span>{formatCurrency(i.subtotal)}</span>
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
				open={stockErrorOpen}
				title="Stock insuficiente"
				onClose={() => setStockErrorOpen(false)}
				footer={
					<div className="pos__receiptActions">
						<PrimaryButton type="button" onClick={() => setStockErrorOpen(false)}>
							Cerrar
						</PrimaryButton>
					</div>
				}
			>
				<div className="pos__empty">
					<div className="pos__emptyTitle">No existe suficiente inventario.</div>
					<div className="pos__emptySubtitle">
						{stockErrorMessage.split("\n").map((line, idx) => (
							<div key={idx}>{line}</div>
						))}
					</div>
				</div>
			</Modal>
		</div>
	);
}
