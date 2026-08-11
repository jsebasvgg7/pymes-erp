import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getCashMovements } from "../services/cashStorage";
import { getPurchases } from "../services/purchaseStorage";
import { getProducts, type Product } from "../services/productStorage";
import { getSales, type Sale } from "../services/salesStorage";
import { getSettings } from "../services/settingsStorage";
import { getUsers } from "../services/userStorage";
import "./DashboardPage.css";

const DEFAULT_STOCK_MIN = 5;

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

type UserMetricRow = {
	label: string;
	value: string;
};

export default function DashboardPage() {
	const sales = getSales();
	const purchases = getPurchases();
	const products = getProducts();
	const cashMovements = getCashMovements();
	const users = getUsers();
	const stockMinimo = getSettings()?.system.defaultMinStock ?? DEFAULT_STOCK_MIN;

	const saldoCaja = cashMovements.reduce((acc, m) => (m.tipo === "Ingreso" ? acc + m.valor : acc - m.valor), 0);

	const recentSales = [...sales]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 5);

	const lowStockProducts = [...products].filter((p) => p.stock <= stockMinimo);

	const recentCashMovements = [...cashMovements]
		.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
		.slice(0, 5);

	const usersActive = users.filter((u) => u.estado === "Activo").length;
	const usersInactive = users.filter((u) => u.estado === "Inactivo").length;

	const salesColumns: Array<DataTableColumn<Sale>> = [
		{ key: "number", header: "Número", render: (r) => `#${r.number}` },
		{ key: "date", header: "Fecha", render: (r) => formatDateTime(r.date) },
		{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) },
		{ key: "paymentMethod", header: "Método de pago", render: (r) => r.paymentMethod }
	];

	const lowStockColumns: Array<DataTableColumn<Product>> = [
		{ key: "producto", header: "Producto", render: (r) => r.nombre },
		{ key: "categoria", header: "Categoría", render: (r) => r.categoria },
		{ key: "stock", header: "Stock", align: "right", render: (r) => r.stock.toLocaleString("es-CO") },
		{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.estado} /> }
	];

	const cashColumns: Array<DataTableColumn<(typeof cashMovements)[number]>> = [
		{ key: "fecha", header: "Fecha", render: (r) => formatDateTime(r.fecha) },
		{ key: "tipo", header: "Tipo", render: (r) => r.tipo },
		{ key: "concepto", header: "Concepto", render: (r) => r.concepto },
		{ key: "valor", header: "Valor", align: "right", render: (r) => formatCurrency(r.valor) }
	];

	const usersRows: UserMetricRow[] = [
		{ label: "Usuarios registrados", value: users.length.toLocaleString("es-CO") },
		{ label: "Usuarios activos", value: usersActive.toLocaleString("es-CO") },
		{ label: "Usuarios inactivos", value: usersInactive.toLocaleString("es-CO") }
	];

	const usersColumns: Array<DataTableColumn<UserMetricRow>> = [
		{ key: "label", header: "Métrica", render: (r) => r.label },
		{ key: "value", header: "Valor", align: "right", render: (r) => r.value }
	];

	return (
		<div className="db">
			<section className="db__metrics" aria-label="Indicadores">
				<StatCard icon="💳" title="Ventas registradas" value={sales.length.toLocaleString("es-CO")} />
				<StatCard icon="🧾" title="Compras registradas" value={purchases.length.toLocaleString("es-CO")} />
				<StatCard icon="📦" title="Productos registrados" value={products.length.toLocaleString("es-CO")} />
				<StatCard icon="💰" title="Saldo actual de Caja" value={formatCurrency(saldoCaja)} />
			</section>

			<section className="db__panels" aria-label="Paneles">
				<article className="db__panel">
					<div className="db__panelHead">
						<PageHeader title="Últimas ventas" />
					</div>

					<DataTable
						columns={salesColumns}
						data={recentSales}
						emptyState={
							<div>
								<div>No existen ventas registradas.</div>
							</div>
						}
					/>
				</article>

				<article className="db__panel">
					<div className="db__panelHead">
						<PageHeader title="Productos con stock bajo" />
					</div>

					<DataTable
						columns={lowStockColumns}
						data={lowStockProducts}
						emptyState={
							<div>
								<div>No hay productos con stock bajo.</div>
							</div>
						}
					/>
				</article>

				<article className="db__panel">
					<div className="db__panelHead">
						<PageHeader title="Movimientos recientes" />
					</div>

					<DataTable
						columns={cashColumns}
						data={recentCashMovements}
						emptyState={
							<div>
								<div>No existen movimientos registrados.</div>
							</div>
						}
					/>
				</article>

				<article className="db__panel">
					<div className="db__panelHead">
						<PageHeader title="Usuarios" />
					</div>

					<DataTable
						columns={usersColumns}
						data={usersRows}
						emptyState={
							<div>
								<div>No hay usuarios registrados.</div>
							</div>
						}
					/>
				</article>
			</section>

			<div className="db__hidden">
				<SearchBar placeholder="Buscar..." />
				<StatusBadge status="Activo" />
				<Modal open={false} title="Modal">
					Contenido
				</Modal>
				<ConfirmDialog open={false} title="Confirmar" message="¿Deseas continuar?" />
			</div>
		</div>
	);
}
