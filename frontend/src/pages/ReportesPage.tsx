import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Package, Receipt, Wallet } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { cajaService, type MovimientoCajaResponse } from "../services/cajaService";
import { compraService, type CompraResponse } from "../services/compraService";
import { productoService, type Producto } from "../services/ProductoService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import "./ReportesPage.css";

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
	const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-CO");
}

function sumCantidad(detalles: Array<{ cantidad: number }>) {
	return detalles.reduce((acc, d) => acc + d.cantidad, 0);
}

export default function ReportesPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [sales, setSales] = useState<FacturaVentaResponse[]>([]);
	const [purchases, setPurchases] = useState<CompraResponse[]>([]);
	const [products, setProducts] = useState<Producto[]>([]);
	const [cashMovements, setCashMovements] = useState<MovimientoCajaResponse[]>([]);
	const [saldoCaja, setSaldoCaja] = useState(0);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [ventasData, comprasData, productosData, movimientosData, resumenes] = await Promise.all([
				ventaService.listarPorEmpresa(empresaId, 0, 100),
				compraService.listarPorEmpresa(empresaId, 0, 100),
				productoService.listarPorEmpresa(empresaId, 0, 200),
				cajaService.listarMovimientosPorEmpresa(empresaId, 0, 100),
				cajaService.obtenerResumenTodas(empresaId)
			]);

			setSales(ventasData.content);
			setPurchases(comprasData.content);
			setProducts(productosData.content);
			setCashMovements(movimientosData.content);
			setSaldoCaja(resumenes.reduce((acc, r) => acc + r.saldoActual, 0));
		} catch {
			setError("No se pudo cargar la información de reportes. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const computed = useMemo(
		() => ({
			ventasRegistradas: sales.length,
			comprasRegistradas: purchases.length,
			productosRegistrados: products.length,
			saldoCaja
		}),
		[sales.length, purchases.length, products.length, saldoCaja]
	);

	const recentSales = useMemo(() => {
		return [...sales].sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());
	}, [sales]);

	const recentPurchases = useMemo(() => {
		return [...purchases].sort((a, b) => new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime());
	}, [purchases]);

	const lowStockProducts = useMemo(() => {
		return products
			.filter((p) => p.stockActual <= p.stockMinimo)
			.sort((a, b) => a.stockActual - b.stockActual);
	}, [products]);

	const recentCash = useMemo(() => {
		return [...cashMovements].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
	}, [cashMovements]);

	const salesColumns: Array<DataTableColumn<FacturaVentaResponse>> = useMemo(
		() => [
			{ key: "numero", header: "Número", render: (r) => r.numero },
			{ key: "fechaEmision", header: "Fecha", render: (r) => formatDateTime(r.fechaEmision) },
			{
				key: "items",
				header: "Cantidad de productos",
				align: "right",
				render: (r) => sumCantidad(r.detalles).toLocaleString("es-CO")
			},
			{ key: "formaPagoNombre", header: "Método de pago", render: (r) => r.formaPagoNombre },
			{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) }
		],
		[]
	);

	const purchasesColumns: Array<DataTableColumn<CompraResponse>> = useMemo(
		() => [
			{ key: "numeroDocumento", header: "Número", render: (r) => r.numeroDocumento },
			{ key: "proveedorNombre", header: "Proveedor", render: (r) => r.proveedorNombre },
			{ key: "fechaCompra", header: "Fecha", render: (r) => formatDate(r.fechaCompra) },
			{
				key: "items",
				header: "Cantidad de productos",
				align: "right",
				render: (r) => sumCantidad(r.detalles).toLocaleString("es-CO")
			},
			{ key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) }
		],
		[]
	);

	const lowStockColumns: Array<DataTableColumn<Producto>> = useMemo(
		() => [
			{ key: "nombre", header: "Producto", render: (r) => r.nombre },
			{ key: "stockActual", header: "Stock", align: "right", render: (r) => r.stockActual.toLocaleString("es-CO") },
			{
				key: "stockMinimo",
				header: "Stock mínimo",
				align: "right",
				render: (r) => r.stockMinimo.toLocaleString("es-CO")
			},
			{
				key: "estado",
				header: "Estado",
				render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} />
			}
		],
		[]
	);

	const cashColumns: Array<DataTableColumn<MovimientoCajaResponse>> = useMemo(
		() => [
			{ key: "fecha", header: "Fecha", render: (r) => formatDateTime(r.fecha) },
			{
				key: "tipo",
				header: "Tipo",
				render: (r) => (
					<span className={["rep__typeBadge", r.tipo === "INGRESO" ? "rep__typeBadge--in" : "rep__typeBadge--out"].join(" ")}>
						<StatusBadge status={r.tipo === "INGRESO" ? "Pagado" : "Anulado"} />
					</span>
				)
			},
			{ key: "descripcion", header: "Concepto", render: (r) => r.descripcion ?? "" },
			{ key: "cajaNombre", header: "Caja", render: (r) => r.cajaNombre },
			{ key: "monto", header: "Valor", align: "right", render: (r) => formatCurrency(r.monto) }
		],
		[]
	);

	if (loading) {
		return (
			<div className="rep">
				<LoadingState label="Cargando reportes..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rep">
				<div className="rep__state rep__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="rep">
			<PageHeader title="Reportes" subtitle="Consulta la información general del negocio." />

			<section className="rep__metrics" aria-label="Resumen">
				<StatCard icon={<CreditCard size={20} strokeWidth={1.8} />} title="Ventas registradas" value={computed.ventasRegistradas.toLocaleString("es-CO")} color="blue" />
				<StatCard icon={<Receipt size={20} strokeWidth={1.8} />} title="Compras registradas" value={computed.comprasRegistradas.toLocaleString("es-CO")} color="amber" />
				<StatCard icon={<Package size={20} strokeWidth={1.8} />} title="Productos registrados" value={computed.productosRegistrados.toLocaleString("es-CO")} color="green" />
				<StatCard icon={<Wallet size={20} strokeWidth={1.8} />} title="Saldo actual de Caja" value={formatCurrency(computed.saldoCaja)} color="blue" footnote="Suma de todas las cajas activas" />
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
						<PageHeader title="Productos con poco inventario" />
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