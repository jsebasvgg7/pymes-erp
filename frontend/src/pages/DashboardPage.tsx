import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Users, Package, AlertTriangle, Wallet } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import StatCard from "../components/StatCard";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import CategoryBreakdownChart from "../components/dashboard/CategoryBreakdownChart";
import { authService } from "../services/authService";
import { dashboardService, type DashboardResumen } from "../services/dashboardService";
import { ventaService, type FacturaVentaResponse } from "../services/VentaService";
import { cajaService, type MovimientoCajaResponse } from "../services/cajaService";
import { productoService, type Producto } from "../services/ProductoService";
import { calcularVentasPorCategoria, calcularNetoCajaHoy, type CategoriaVenta } from "../services/dashboardAnalytics";
import "./DashboardPage.css";

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateTime(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function formatDateInput(value: Date) {
	return value.toISOString().slice(0, 10);
}

// El backend espera LocalDateTime ISO completo (@DateTimeFormat ISO.DATE_TIME),
// no solo la fecha — de lo contrario Spring falla el bind y responde 500.
function toInicioDeDia(fechaYMD: string) {
	return `${fechaYMD}T00:00:00`;
}

function toFinDeDia(fechaYMD: string) {
	return `${fechaYMD}T23:59:59`;
}

type MovimientoUnificado = {
	id: string;
	fecha: string;
	tipo: "INGRESO" | "EGRESO";
	concepto: string;
	valor: number;
};

const RANGO_DIAS_DEFECTO = 240;

export default function DashboardPage() {
	const usuario = authService.getUsuario();
	const empresaId = usuario?.empresaId;

	const [loading, setLoading] = useState(true);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resumen, setResumen] = useState<DashboardResumen | null>(null);
	const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCajaResponse[]>([]);

	const [fechaInicio, setFechaInicio] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() - RANGO_DIAS_DEFECTO);
		return formatDateInput(d);
	});
	const [fechaFin, setFechaFin] = useState(() => formatDateInput(new Date()));
	const [facturasPeriodo, setFacturasPeriodo] = useState<FacturaVentaResponse[]>([]);
	const [productos, setProductos] = useState<Producto[]>([]);

	const cargarDashboard = useCallback(
		async (empresaIdActual: number, signalCancelled: () => boolean) => {
			const [resumenData, cajaData, productosData] = await Promise.all([
				dashboardService.obtenerResumen(empresaIdActual),
				cajaService.listarMovimientosPorEmpresa(empresaIdActual, 0, 200),
				productoService.listarPorEmpresa(empresaIdActual, 0, 500)
			]);

			if (signalCancelled()) return;

			setResumen(resumenData);
			setMovimientosCaja(
				[...cajaData.content].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
			);
			setProductos(productosData.content);
		},
		[]
	);

	const cargarFacturasPeriodo = useCallback(
		async (empresaIdActual: number, inicio: string, fin: string, signalCancelled: () => boolean) => {
			const facturas = await ventaService.obtenerPorPeriodo(
				empresaIdActual,
				toInicioDeDia(inicio),
				toFinDeDia(fin)
			);
			if (signalCancelled()) return;
			setFacturasPeriodo(facturas);
		},
		[]
	);

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
				await Promise.all([
					cargarDashboard(empresaIdActual, () => cancelled),
					cargarFacturasPeriodo(empresaIdActual, fechaInicio, fechaFin, () => cancelled)
				]);
			} catch (err) {
				console.error("Error cargando dashboard:", err);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [empresaId]);

	const esPrimerRenderRango = useRef(true);

	useEffect(() => {
		if (esPrimerRenderRango.current) {
			esPrimerRenderRango.current = false;
			return;
		}
		if (!empresaId) return;
		let cancelled = false;
		cargarFacturasPeriodo(empresaId, fechaInicio, fechaFin, () => cancelled).catch((err) => {
			console.error("Error cargando ventas del período:", err);
			if (!cancelled) setError("No se pudieron cargar las ventas del período seleccionado.");
		});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fechaInicio, fechaFin]);

	async function handleRecargar() {
		if (!empresaId || reloading) return;
		setReloading(true);
		setError(null);
		try {
			let cancelled = false;
			await Promise.all([
				cargarDashboard(empresaId, () => cancelled),
				cargarFacturasPeriodo(empresaId, fechaInicio, fechaFin, () => cancelled)
			]);
		} catch {
			setError("No se pudo actualizar la información. Intenta de nuevo.");
		} finally {
			setReloading(false);
		}
	}

	const categoriasVenta: CategoriaVenta[] = useMemo(
		() => calcularVentasPorCategoria(facturasPeriodo, productos),
		[facturasPeriodo, productos]
	);

	const netoCajaHoy = useMemo(() => calcularNetoCajaHoy(movimientosCaja), [movimientosCaja]);
	const variacionCaja =
		netoCajaHoy !== 0 ? `${netoCajaHoy > 0 ? "+" : "-"}${formatCurrency(Math.abs(netoCajaHoy))} hoy` : undefined;

	const movimientosUnificados: MovimientoUnificado[] = useMemo(
		() =>
			movimientosCaja.map((m) => ({
				id: `caja-${m.id}`,
				fecha: m.fecha,
				tipo: m.tipo,
				concepto: m.descripcion || (m.tipo === "INGRESO" ? `Ingreso · ${m.cajaNombre}` : `Egreso · ${m.cajaNombre}`),
				valor: m.monto
			})),
		[movimientosCaja]
	);

	const movimientosColumns: Array<DataTableColumn<MovimientoUnificado>> = [
		{ key: "check", header: "", render: () => <input type="checkbox" aria-label="Seleccionar fila" /> },
		{ key: "fecha", header: "Fecha", render: (r) => formatDateTime(r.fecha) },
		{ key: "tipo", header: "Tipo", render: (r) => (r.tipo === "INGRESO" ? "Ingreso" : "Egreso") },
		{ key: "concepto", header: "Concepto", render: (r) => r.concepto },
		{ key: "valor", header: "Valor", align: "right", render: (r) => formatCurrency(r.valor) }
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
			<div className="db__header">
				<h1 className="db__greetingTitle">Bienvenido, {nombreUsuario}</h1>
				<div className="db__headerActions">
					<button type="button" className="db__todaySelect" disabled>
						Hoy
					</button>
					<button
						type="button"
						className="db__reloadBtn"
						onClick={handleRecargar}
						disabled={reloading}
					>
						<RefreshCw size={14} strokeWidth={2} className={reloading ? "db__reloadIcon--spin" : ""} />
						Recargar
					</button>
				</div>
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
					variation={variacionCaja}
				/>
			</section>

			<section className="db__charts" aria-label="Gráficos">
				<CashFlowChart movimientos={movimientosCaja} />
				<CategoryBreakdownChart
					categorias={categoriasVenta}
					fechaInicio={fechaInicio}
					fechaFin={fechaFin}
					onChangeRango={(inicio, fin) => {
						setFechaInicio(inicio);
						setFechaFin(fin);
					}}
				/>
			</section>

			<section className="db__panels" aria-label="Movimientos">
				<article className="db__panel db__panel--full">
					<div className="db__panelHead">
						<span className="db__panelTitle">Movimientos recientes</span>
					</div>

					<DataTable
						columns={movimientosColumns}
						data={movimientosUnificados}
						emptyState={
							<div>
								<div>No existen movimientos registrados.</div>
							</div>
						}
					/>
				</article>
			</section>
		</div>
	);
}