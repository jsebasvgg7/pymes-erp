import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Users, Package, AlertTriangle, Wallet, Info, Check } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import StatCard from "../components/StatCard";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import CategoryBreakdownChart from "../components/dashboard/CategoryBreakdownChart";
import { authService } from "../services/authService";
import { dashboardService, type DashboardResumen } from "../services/dashboardService";
import { ventaService, type CategoriaVenta } from "../services/VentaService";
import { cajaService, type MovimientoCajaResponse, type FlujoCajaDiario } from "../services/cajaService";
import { productoService, type Producto } from "../services/ProductoService";
import { clienteService, type Cliente } from "../services/clienteService";
import { calcularNetoCajaHoy, calcularRegistradosAyer } from "../services/dashboardAnalytics";
import "../components/dashboard/dashboard-charts.css";
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
	caja: string;
	formaPago: string;
	referencia: string;
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
	const [categoriasVenta, setCategoriasVenta] = useState<CategoriaVenta[]>([]);
	const [flujoCajaDiario, setFlujoCajaDiario] = useState<FlujoCajaDiario[]>([]);
	const [productos, setProductos] = useState<Producto[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);

	const cargarDashboard = useCallback(
		async (empresaIdActual: number, signalCancelled: () => boolean) => {
			const [resumenData, cajaData, flujoData, productosData, clientesData] = await Promise.all([
				dashboardService.obtenerResumen(empresaIdActual),
				cajaService.listarMovimientosPorEmpresa(empresaIdActual, 0, 50),
				cajaService.obtenerFlujoCajaDiario(empresaIdActual, 12).catch((e) => {
					console.error("Flujo de caja no disponible:", e);
					return [] as FlujoCajaDiario[];
				}),
				productoService.listarPorEmpresa(empresaIdActual, 0, 200),
				clienteService.listarPorEmpresa(empresaIdActual, 0, 200)
			]);

			if (signalCancelled()) return;

			setResumen(resumenData);
			setMovimientosCaja(
				[...cajaData.content].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
			);
			setFlujoCajaDiario(flujoData);
			setProductos(productosData.content);
			setClientes(clientesData.content);
		},
		[]
	);

	const cargarVentasPorCategoria = useCallback(
		async (empresaIdActual: number, inicio: string, fin: string, signalCancelled: () => boolean) => {
			const categorias = await ventaService
				.obtenerVentasPorCategoria(empresaIdActual, toInicioDeDia(inicio), toFinDeDia(fin))
				.catch((e) => {
					console.error("Ventas por categoría no disponibles:", e);
					return [] as CategoriaVenta[];
				});
			if (signalCancelled()) return;
			setCategoriasVenta(categorias);
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
					cargarVentasPorCategoria(empresaIdActual, fechaInicio, fechaFin, () => cancelled)
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
		cargarVentasPorCategoria(empresaId, fechaInicio, fechaFin, () => cancelled).catch((err) => {
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
				cargarVentasPorCategoria(empresaId, fechaInicio, fechaFin, () => cancelled)
			]);
		} catch {
			setError("No se pudo actualizar la información. Intenta de nuevo.");
		} finally {
			setReloading(false);
		}
	}

	const netoCajaHoy = useMemo(() => calcularNetoCajaHoy(movimientosCaja), [movimientosCaja]);
	const variacionCaja =
		netoCajaHoy !== 0
			? {
					direction: (netoCajaHoy > 0 ? "up" : "down") as "up" | "down",
					text: `${formatCurrency(Math.abs(netoCajaHoy))} hoy`
			  }
			: undefined;

	const clientesAyer = useMemo(() => calcularRegistradosAyer(clientes), [clientes]);
	const variacionClientes =
		clientesAyer !== 0 ? { direction: "up" as const, text: `${clientesAyer} ayer` } : undefined;

	const productosAyer = useMemo(() => calcularRegistradosAyer(productos), [productos]);
	const variacionProductos =
		productosAyer !== 0 ? { direction: "up" as const, text: `${productosAyer} ayer` } : undefined;

	const movimientosUnificados: MovimientoUnificado[] = useMemo(
		() =>
			movimientosCaja.map((m) => ({
				id: `caja-${m.id}`,
				fecha: m.fecha,
				tipo: m.tipo,
				concepto: m.descripcion || (m.tipo === "INGRESO" ? `Ingreso · ${m.cajaNombre}` : `Egreso · ${m.cajaNombre}`),
				valor: m.monto,
				caja: m.cajaNombre,
				formaPago: m.formaPagoNombre,
				referencia: m.tipoReferencia
			})),
		[movimientosCaja]
	);

	const movimientosColumns: Array<DataTableColumn<MovimientoUnificado>> = [
		{
			key: "check",
			header: "",
			width: "32px",
			render: () => <input type="checkbox" aria-label="Seleccionar fila" />
		},
		{ key: "fecha", header: "Fecha", width: "minmax(140px, 1.1fr)", render: (r) => formatDateTime(r.fecha) },
		{
			key: "tipo",
			header: "Tipo",
			width: "minmax(90px, 0.6fr)",
			render: (r) => (
				<span className={`db__movBadge ${r.tipo === "INGRESO" ? "db__movBadge--ingreso" : "db__movBadge--egreso"}`}>
					{r.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
				</span>
			)
		},
		{ key: "concepto", header: "Concepto", width: "minmax(160px, 1.6fr)", render: (r) => r.concepto },
		{ key: "caja", header: "Caja", width: "minmax(100px, 0.9fr)", render: (r) => r.caja },
		{ key: "formaPago", header: "Forma de pago", width: "minmax(100px, 0.9fr)", render: (r) => r.formaPago },
		{ key: "referencia", header: "Referencia", width: "minmax(90px, 0.7fr)", render: (r) => r.referencia },
		{ key: "valor", header: "Valor", align: "right", width: "minmax(90px, 0.8fr)", render: (r) => formatCurrency(r.valor) }
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
					variation={variacionClientes}
				/>
				<StatCard
					icon={<Package size={20} strokeWidth={1.8} />}
					title="Productos registrados"
					value={(resumen?.totalProductos ?? 0).toLocaleString("es-CO")}
					color="blue"
					variation={variacionProductos}
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
				<CashFlowChart puntosDiarios={flujoCajaDiario} />
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
						<div className="db__panelHeadLeft">
							<span className="db__panelTitle">Movimientos recientes</span>
							<Info size={13} strokeWidth={2} className="dbChart__infoIcon" />
						</div>
						<span className="dbChart__verifiedBadge">
							<Check size={12} strokeWidth={3} />
						</span>
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