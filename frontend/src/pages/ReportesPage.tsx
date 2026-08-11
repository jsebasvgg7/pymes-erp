import { useMemo } from "react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getCashMovements, type CashMovement } from "../services/cashStorage";
import { getPurchases, type Purchase } from "../services/purchaseStorage";
import { getSales, type Sale } from "../services/salesStorage";
import { getProducts, type Product } from "../services/productStorage";
import { getSettings } from "../services/settingsStorage";
import "./ReportesPage.css";

const DEFAULT_STOCK_MIN = 5;

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function formatDate(value: string) {
	if (!value) return "";
	const d = new Date(`${value}T00:00:00`);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-CO");
}

function getLocalDateKey(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function ReportesPage() {
	const sales = useMemo(() => getSales(), []);
	const purchases = useMemo(() => getPurchases(), []);
	const products = useMemo(() => getProducts(), []);
	const cashMovements = useMemo(() => getCashMovements(), []);
	const stockMinimo = useMemo(() => getSettings()?.system.defaultMinStock ?? DEFAULT_STOCK_MIN, []);

	const computed = useMemo(() => {
		const saldo = cashMovements.reduce((acc, m) => (m.tipo === "Ingreso" ? acc + m.valor : acc - m.valor), 0);
		return {
			ventasRegistradas: sales.length,
			comprasRegistradas: purchases.length,
			productosRegistrados: products.length,
			saldoCaja: saldo
		};
	}, [cashMovements, products.length, purchases.length, sales.length]);

	const recentSales = useMemo(() => {
		return [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [sales]);

	const recentPurchases = useMemo(() => {
		return [...purchases].sort((a, b) => {
			const byDate = new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime();
			return byDate !== 0 ? byDate : b.number - a.number;
		});
	}, [purchases]);

	const lowStockProducts = useMemo(() => {
		return products
			.filter((p) => p.stock <= stockMinimo)
			.sort((a, b) => a.stock - b.stock);
	}, [products, stockMinimo]);

	const recentCash = useMemo(() => {
		return [...cashMovements].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
	}, [cashMovements]);

	const salesColumns: Array<DataTableColumn<Sale>> = useMemo(
		() => [
			{ key: "number", header: "Número", render: (r) => `#${r.number}` },
			{ key: "date", header: "Fecha", render: (r) => formatDateTime(r.date) },
			{
				key: "items",
				header: "Cantidad de productos",
				align: "right",
				render: (r) => r.items.reduce((acc, i) => acc + i.quantity, 0).toLocaleString("es-CO")
			},
			{ key: "paymentMethod", header: "Método de pago", render: (r) => r.paymentMethod },
			{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) }
		],
		[]
	);

	const purchasesColumns: Array<DataTableColumn<Purchase>> = useMemo(
		() => [
			{ key: "number", header: "Número", render: (r) => `#${r.number}` },
			{ key: "provider", header: "Proveedor", render: (r) => r.providerName },
			{ key: "date", header: "Fecha", render: (r) => formatDate(r.date) },
			{
				key: "items",
				header: "Cantidad de productos",
				align: "right",
				render: (r) => r.totalQuantity.toLocaleString("es-CO")
			},
			{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) }
		],
		[]
	);

	const lowStockColumns: Array<DataTableColumn<Product>> = useMemo(
		() => [
			{ key: "producto", header: "Producto", render: (r) => r.nombre },
			{ key: "categoria", header: "Categoría", render: (r) => r.categoria },
			{ key: "stock", header: "Stock", align: "right", render: (r) => r.stock.toLocaleString("es-CO") },
			{
				key: "stockMin",
				header: "Stock mínimo",
				align: "right",
				render: () => stockMinimo.toLocaleString("es-CO")
			},
			{
				key: "estado",
				header: "Estado",
				render: (r) => <StatusBadge status={r.estado} />
			}
		],
		[stockMinimo]
	);

	const cashColumns: Array<DataTableColumn<CashMovement>> = useMemo(
		() => [
			{ key: "fecha", header: "Fecha", render: (r) => formatDateTime(r.fecha) },
			{
				key: "tipo",
				header: "Tipo",
				render: (r) => (
					<span className={["rep__typeBadge", r.tipo === "Ingreso" ? "rep__typeBadge--in" : "rep__typeBadge--out"].join(" ")}>
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

	const lowStockHint = useMemo(() => {
		const key = getLocalDateKey(new Date());
		return `Mínimo: ${stockMinimo} — ${key}`;
	}, [stockMinimo]);

	return (
		<div className="rep">
			<PageHeader title="Reportes" subtitle="Consulta la información general del negocio." />

			<section className="rep__metrics" aria-label="Resumen">
				<StatCard icon="💳" title="Ventas registradas" value={computed.ventasRegistradas.toLocaleString("es-CO")} color="blue" footnote="LocalStorage" />
				<StatCard icon="🧾" title="Compras registradas" value={computed.comprasRegistradas.toLocaleString("es-CO")} color="amber" footnote="LocalStorage" />
				<StatCard icon="📦" title="Productos registrados" value={computed.productosRegistrados.toLocaleString("es-CO")} color="green" footnote="LocalStorage" />
				<StatCard icon="💰" title="Saldo actual de Caja" value={formatCurrency(computed.saldoCaja)} color="blue" footnote="Ingresos - Egresos" />
			</section>

			<section className="rep__panels" aria-label="Secciones">
				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Ventas recientes" />
					</div>
					<DataTable
						columns={salesColumns}
						data={recentSales}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">No existen ventas registradas.</div>
								<div className="rep__emptySubtitle">Finaliza una venta en POS para verla aquí.</div>
							</div>
						}
					/>
				</article>

				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Compras recientes" />
					</div>
					<DataTable
						columns={purchasesColumns}
						data={recentPurchases}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">No existen compras registradas.</div>
								<div className="rep__emptySubtitle">Registra una compra para verla aquí.</div>
							</div>
						}
					/>
				</article>

				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Productos con poco inventario" subtitle={lowStockHint} />
					</div>
					<DataTable
						columns={lowStockColumns}
						data={lowStockProducts}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">No hay productos con poco inventario.</div>
								<div className="rep__emptySubtitle">Los productos con stock bajo aparecen automáticamente aquí.</div>
							</div>
						}
					/>
				</article>

				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Movimientos recientes de Caja" />
					</div>
					<DataTable
						columns={cashColumns}
						data={recentCash}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">No existen movimientos registrados.</div>
								<div className="rep__emptySubtitle">Registra movimientos manuales para verlos aquí.</div>
							</div>
						}
					/>
				</article>
			</section>
		</div>
	);
}
