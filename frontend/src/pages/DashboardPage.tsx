import { useEffect, useState } from "react";
import { Users, Package, AlertTriangle, Wallet } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { dashboardService, type DashboardResumen } from "../services/dashboardService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import { cajaService, type MovimientoCajaResponse } from "../services/cajaService";
import { productoService, type Producto } from "../services/ProductoService";
import "./DashboardPage.css";

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function formatDayLabel(value: Date) {
	return value.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

export default function DashboardPage() {
	const usuario = authService.getUsuario();
	const empresaId = usuario?.empresaId;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [resumen, setResumen] = useState<DashboardResumen | null>(null);
	const [recentSales, setRecentSales] = useState<FacturaVentaResponse[]>([]);
	const [lowStockProducts, setLowStockProducts] = useState<Producto[]>([]);
	const [recentCashMovements, setRecentCashMovements] = useState<MovimientoCajaResponse[]>([]);

	useEffect(() => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		const empresaIdActual: number = empresaId;
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const [resumenData, ventasData, stockBajoData, cajaData] = await Promise.all([
					dashboardService.obtenerResumen(empresaIdActual),
					ventaService.listarPorEmpresa(empresaIdActual, 0, 5),
					productoService.obtenerStockBajo(empresaIdActual),
					cajaService.listarMovimientosPorEmpresa(empresaIdActual, 0, 5)
				]);

				if (cancelled) return;

				setResumen(resumenData);
				setRecentSales(
					[...ventasData.content].sort(
						(a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
					)
				);
				setLowStockProducts(stockBajoData);
				setRecentCashMovements(
					[...cajaData.content].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
				);
			} catch (err) {
				if (!cancelled) {
					setError("No se pudo cargar la información del dashboard. Verifica tu conexión con el servidor.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [empresaId]);

	const salesColumns: Array<DataTableColumn<FacturaVentaResponse>> = [
		{ key: "numero", header: "Número", render: (r) => `#${r.numero}` },
		{ key: "fechaEmision", header: "Fecha", render: (r) => formatDateTime(r.fechaEmision) },
		{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) },
		{ key: "formaPagoNombre", header: "Método de pago", render: (r) => r.formaPagoNombre }
	];

	const lowStockColumns: Array<DataTableColumn<Producto>> = [
		{ key: "producto", header: "Producto", render: (r) => r.nombre },
		{ key: "categoria", header: "Categoría", render: (r) => r.categoriaNombre },
		{ key: "stock", header: "Stock", align: "right", render: (r) => r.stockActual.toLocaleString("es-CO") },
		{ key: "estado", header: "Estado", render: () => <StatusBadge status="Pendiente" /> }
	];

	const cashColumns: Array<DataTableColumn<MovimientoCajaResponse>> = [
		{ key: "fecha", header: "Fecha", render: (r) => formatDateTime(r.fecha) },
		{ key: "tipo", header: "Tipo", render: (r) => (r.tipo === "INGRESO" ? "Ingreso" : "Egreso") },
		{ key: "concepto", header: "Concepto", render: (r) => r.descripcion },
		{ key: "valor", header: "Valor", align: "right", render: (r) => formatCurrency(r.monto) }
	];

	type CajaRow = { label: string; value: string };

	const cajasRows: CajaRow[] = (resumen?.cajas ?? []).map((c) => ({
		label: c.cajaNombre,
		value: formatCurrency(c.saldoActual)
	}));

	const cajasColumns: Array<DataTableColumn<CajaRow>> = [
		{ key: "label", header: "Caja", render: (r) => r.label },
		{ key: "value", header: "Saldo", align: "right", render: (r) => r.value }
	];

	if (loading) {
		return (
			<div className="db">
				<LoadingState label="Cargando dashboard..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="db">
				<div className="db__state db__state--error">{error}</div>
			</div>
		);
	}

	const nombreUsuario = usuario?.username ?? "";
	const stockBajo = resumen?.productosStockBajo ?? 0;

	return (
		<div className="db">
			<div className="db__greeting">
				<h1 className="db__greetingTitle">Hola, {nombreUsuario}</h1>
				<p className="db__greetingSubtitle">{formatDayLabel(new Date())}</p>
			</div>

			<section className="db__metrics" aria-label="Indicadores">
				<StatCard
					icon={<Users size={20} strokeWidth={1.8} />}
					title="Clientes registrados"
					value={(resumen?.totalClientes ?? 0).toLocaleString("es-CO")}
					color="blue"
				/>
				<StatCard
					icon={<Package size={20} strokeWidth={1.8} />}
					title="Productos registrados"
					value={(resumen?.totalProductos ?? 0).toLocaleString("es-CO")}
					color="blue"
				/>
				<StatCard
					icon={<AlertTriangle size={20} strokeWidth={1.8} />}
					title="Productos con stock bajo"
					value={stockBajo.toLocaleString("es-CO")}
					color={stockBajo > 0 ? "amber" : "green"}
				/>
				<StatCard
					icon={<Wallet size={20} strokeWidth={1.8} />}
					title="Saldo total en cajas"
					value={formatCurrency(resumen?.saldoTotalCajas ?? 0)}
					color="green"
				/>
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
						<PageHeader title="Movimientos recientes de caja" />
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
						<PageHeader title="Cajas" />
					</div>

					<DataTable
						columns={cajasColumns}
						data={cajasRows}
						emptyState={
							<div>
								<div>No hay cajas registradas.</div>
							</div>
						}
					/>
				</article>
			</section>
		</div>
	);
}