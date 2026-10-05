import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Download, Package, Receipt, Wallet } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { cajaService, type MovimientoCajaResponse } from "../services/cajaService";
import { compraService, type CompraResponse } from "../services/compraService";
import { fetchAllPages } from "../services/pagination";
import { productoService, type Producto } from "../services/ProductoService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import {
	cargarVentasHoyAyer,
	contarEnDia,
	etiquetaCompras,
	etiquetaVentas,
	variacionNuevosHoy,
	variacionVsAyer,
	type VentasHoyAyer
} from "../services/comparacionDiaria";
import { downloadCsv } from "../utils/csv";
import "./ReportesPage.css";

function fechaLocal(fecha: Date) {
	const año = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	return `${año}-${mes}-${dia}`;
}

function periodoMesActual() {
	const hoy = new Date();
	return {
		inicio: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
		fin: fechaLocal(hoy)
	};
}

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
	const [periodo, setPeriodo] = useState(periodoMesActual);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadingPeriodo, setLoadingPeriodo] = useState(true);
	const [errorPeriodo, setErrorPeriodo] = useState<string | null>(null);

	const [sales, setSales] = useState<FacturaVentaResponse[]>([]);
	const [purchases, setPurchases] = useState<CompraResponse[]>([]);
	const [purchasesForVariation, setPurchasesForVariation] = useState<CompraResponse[]>([]);
	const [products, setProducts] = useState<Producto[]>([]);
	const [cashMovements, setCashMovements] = useState<MovimientoCajaResponse[]>([]);
	const [saldoCaja, setSaldoCaja] = useState(0);
	const [totales, setTotales] = useState({ ventas: 0, compras: 0, productos: 0 });
	const [ventasDia, setVentasDia] = useState<VentasHoyAyer | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [ventasData, comprasData, productosData, productosTotal, movimientosData, resumenes, ventasDiaData] = await Promise.all([
				ventaService.listarPorEmpresa(empresaId, 0, 1),
				compraService.listarPorEmpresa(empresaId, 0, 100),
				productoService.listarTodosPorEmpresa(empresaId),
				productoService.listarPorEmpresa(empresaId, 0, 1),
				fetchAllPages((page, size) => cajaService.listarMovimientosPorEmpresa(empresaId, page, size)),
				cajaService.obtenerResumenTodas(empresaId),
				cargarVentasHoyAyer(empresaId).catch(() => null)
			]);

			setProducts(productosData);
			setCashMovements(movimientosData);
			setPurchasesForVariation(comprasData.content);
			setSaldoCaja(resumenes.reduce((acc, r) => acc + r.saldoActual, 0));
			setTotales({
				ventas: ventasData.totalElements,
				compras: comprasData.totalElements,
				productos: productosTotal.totalElements
			});
			setVentasDia(ventasDiaData);
		} catch {
			setError("No se pudo cargar la información de reportes. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		if (!empresaId) return;
		if (!periodo.inicio || !periodo.fin) {
			setErrorPeriodo("Selecciona las dos fechas del período.");
			setSales([]);
			setPurchases([]);
			setLoadingPeriodo(false);
			return;
		}
		if (periodo.inicio > periodo.fin) {
			setErrorPeriodo("La fecha inicial no puede ser posterior a la fecha final.");
			setSales([]);
			setPurchases([]);
			setLoadingPeriodo(false);
			return;
		}

		let activo = true;
		setSales([]);
		setPurchases([]);
		setLoadingPeriodo(true);
		setErrorPeriodo(null);
		const inicio = `${periodo.inicio}T00:00:00`;
		const fin = `${periodo.fin}T23:59:59.999999999`;
		void Promise.all([
			ventaService.obtenerPorPeriodo(empresaId, inicio, fin),
			compraService.obtenerPorPeriodo(empresaId, inicio, fin)
		])
			.then(([ventasPeriodo, comprasPeriodo]) => {
				if (activo) {
					setSales(ventasPeriodo);
					setPurchases(comprasPeriodo);
				}
			})
			.catch(() => {
				if (activo) {
					setSales([]);
					setPurchases([]);
					setErrorPeriodo("No se pudieron cargar las ventas y compras del período seleccionado.");
				}
			})
			.finally(() => {
				if (activo) setLoadingPeriodo(false);
			});
		return () => {
			activo = false;
		};
	}, [empresaId, periodo.fin, periodo.inicio]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const computed = useMemo(
		() => ({
			ventasRegistradas: totales.ventas,
			comprasRegistradas: totales.compras,
			productosRegistrados: totales.productos,
			saldoCaja
		}),
		[totales, saldoCaja]
	);

	const variacionVentas = useMemo(
		() => (ventasDia ? variacionVsAyer(ventasDia.hoy.cantidad, ventasDia.ayer.cantidad, etiquetaVentas) : undefined),
		[ventasDia]
	);

	const variacionCompras = useMemo(
		() =>
			variacionVsAyer(
				contarEnDia(purchasesForVariation.map((c) => c.fechaCompra), 0),
				contarEnDia(purchasesForVariation.map((c) => c.fechaCompra), -1),
				etiquetaCompras
			),
		[purchasesForVariation]
	);

	const variacionProductos = useMemo(
		() => variacionNuevosHoy(contarEnDia(products.map((p) => p.createdAt), 0)),
		[products]
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
		return cashMovements
			.filter((movement) => {
				const date = movement.fecha.slice(0, 10);
				return date >= periodo.inicio && date <= periodo.fin;
			})
			.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
	}, [cashMovements, periodo.fin, periodo.inicio]);

	const filePeriod = `${periodo.inicio}_${periodo.fin}`;

	const exportSales = useCallback(() => {
		downloadCsv(
			`ventas_${filePeriod}.csv`,
			["Número", "Fecha", "Cantidad de productos", "Método de pago", "Descuento", "Total"],
			recentSales.map((sale) => [
				sale.numero,
				sale.fechaEmision,
				sumCantidad(sale.detalles),
				sale.formaPagoNombre,
				sale.descuento,
				sale.total
			])
		);
	}, [filePeriod, recentSales]);

	const exportPurchases = useCallback(() => {
		downloadCsv(
			`compras_${filePeriod}.csv`,
			["Número", "Proveedor", "Fecha", "Cantidad de productos", "Total"],
			recentPurchases.map((purchase) => [
				purchase.numeroDocumento,
				purchase.proveedorNombre,
				purchase.fechaCompra,
				sumCantidad(purchase.detalles),
				purchase.total
			])
		);
	}, [filePeriod, recentPurchases]);

	const exportLowStock = useCallback(() => {
		downloadCsv(
			"productos_con_poco_inventario.csv",
			["Producto", "Stock actual", "Stock mínimo", "Estado"],
			lowStockProducts.map((product) => [
				product.nombre,
				product.stockActual,
				product.stockMinimo,
				product.active ? "Activo" : "Inactivo"
			])
		);
	}, [lowStockProducts]);

	const exportCash = useCallback(() => {
		downloadCsv(
			`movimientos_caja_${filePeriod}.csv`,
			["Fecha", "Tipo", "Concepto", "Caja", "Valor"],
			recentCash.map((movement) => [
				movement.fecha,
				movement.tipo,
				movement.descripcion,
				movement.cajaNombre,
				movement.monto
			])
		);
	}, [filePeriod, recentCash]);

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
			{
				key: "descuento",
				header: "Descuento",
				align: "right",
				render: (r) => (r.descuento > 0 ? formatCurrency(r.descuento) : "—")
			},
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

			<section className="rep__period" aria-label="Filtro de período">
				<div className="rep__periodFields">
					<label className="rep__dateField">
						<span>Desde</span>
						<input
							type="date"
							value={periodo.inicio}
							max={periodo.fin || undefined}
							onChange={(event) => setPeriodo((current) => ({ ...current, inicio: event.target.value }))}
						/>
					</label>
					<label className="rep__dateField">
						<span>Hasta</span>
						<input
							type="date"
							value={periodo.fin}
							min={periodo.inicio || undefined}
							onChange={(event) => setPeriodo((current) => ({ ...current, fin: event.target.value }))}
						/>
					</label>
				</div>
				<p className="rep__periodHint">El período filtra ventas, compras y movimientos de Caja. El inventario y el saldo muestran el estado actual.</p>
				{errorPeriodo && <p className="rep__periodError" role="alert">{errorPeriodo}</p>}
			</section>

			<section className="rep__metrics" aria-label="Resumen">
				<StatCard icon={<CreditCard size={20} strokeWidth={1.8} />} title="Ventas registradas" value={computed.ventasRegistradas.toLocaleString("es-CO")} color="blue" variation={variacionVentas} />
				<StatCard icon={<Receipt size={20} strokeWidth={1.8} />} title="Compras registradas" value={computed.comprasRegistradas.toLocaleString("es-CO")} color="amber" variation={variacionCompras} />
				<StatCard icon={<Package size={20} strokeWidth={1.8} />} title="Productos registrados" value={computed.productosRegistrados.toLocaleString("es-CO")} color="green" variation={variacionProductos} />
				<StatCard icon={<Wallet size={20} strokeWidth={1.8} />} title="Saldo actual de Caja" value={formatCurrency(computed.saldoCaja)} color="blue" />
			</section>

			<section className="rep__panels" aria-label="Secciones">
				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Ventas del período" />
						<button type="button" className="rep__exportButton" onClick={exportSales} disabled={loadingPeriodo || recentSales.length === 0}>
							<Download size={15} />
							<span>Exportar CSV</span>
						</button>
					</div>
					<DataTable
						columns={salesColumns}
						data={recentSales}
						pageSize={10}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">{loadingPeriodo ? "Cargando ventas..." : "No existen ventas en este período."}</div>
								<div className="rep__emptySubtitle">{loadingPeriodo ? "Espera mientras se actualiza el informe." : "Ajusta las fechas o finaliza una venta en POS."}</div>
							</div>
						}
					/>
				</article>

				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Compras del período" />
						<button type="button" className="rep__exportButton" onClick={exportPurchases} disabled={loadingPeriodo || recentPurchases.length === 0}>
							<Download size={15} />
							<span>Exportar CSV</span>
						</button>
					</div>
					<DataTable
						columns={purchasesColumns}
						data={recentPurchases}
						pageSize={10}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">{loadingPeriodo ? "Cargando compras..." : "No existen compras en este período."}</div>
								<div className="rep__emptySubtitle">{loadingPeriodo ? "Espera mientras se actualiza el informe." : "Ajusta las fechas o registra una compra."}</div>
							</div>
						}
					/>
				</article>

				<article className="rep__panel">
					<div className="rep__panelHead">
						<PageHeader title="Productos con poco inventario" />
						<button type="button" className="rep__exportButton" onClick={exportLowStock} disabled={lowStockProducts.length === 0}>
							<Download size={15} />
							<span>Exportar CSV</span>
						</button>
					</div>
					<DataTable
						columns={lowStockColumns}
						data={lowStockProducts}
						pageSize={10}
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
						<button type="button" className="rep__exportButton" onClick={exportCash} disabled={recentCash.length === 0}>
							<Download size={15} />
							<span>Exportar CSV</span>
						</button>
					</div>
					<DataTable
						columns={cashColumns}
						data={recentCash}
						pageSize={10}
						emptyState={
							<div className="rep__empty">
								<div className="rep__emptyTitle">No existen movimientos de Caja en este período.</div>
								<div className="rep__emptySubtitle">Ajusta las fechas para consultar otros movimientos.</div>
							</div>
						}
					/>
				</article>
			</section>
		</div>
	);
}