import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Users, Package, AlertTriangle, Wallet, ShoppingCart } from "lucide-react";
import DataTable, { DataTableLayout } from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import AperturaCajaControl from "../components/AperturaCajaControl";
import { useEstadoCaja } from "../hooks/useEstadoCaja";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { etiquetaMovimiento } from "../utils/etiquetaMovimiento";
import { formatDateShort } from "../utils/formatDate";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import StatCard from "../components/StatCard";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import CategoryBreakdownChart from "../components/dashboard/CategoryBreakdownChart";
import { authService } from "../services/authService";
import { dashboardService, type DashboardResumen } from "../services/dashboardService";
import { ventaService, type CategoriaVenta } from "../services/VentaService";
import { cajaService, type MovimientoCajaResponse, type FlujoCajaDiario } from "../services/cajaService";
import { productoService, type Producto } from "../services/ProductoService";
import { clienteService, type Cliente } from "../services/clienteService";
import { calcularNetoCajaHoy } from "../services/dashboardAnalytics";
import {
	cargarVentasHoyAyer,
	contarEnDia,
	etiquetaVentas,
	variacionNuevosHoy,
	variacionVsAyer,
	type VentasHoyAyer
} from "../services/comparacionDiaria";
import "../components/dashboard/dashboard-charts.css";
import "./DashboardPage.css";
import { formatCurrency, useFormato } from "../utils/formatoConfig";
import { useAjustes } from "../utils/ajustesConfig";

function formatDateInput(value: Date) {
	return value.toISOString().slice(0, 10);
}

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
	useFormato();
	const { avisarStockBajo } = useAjustes();
	const usuario = authService.getUsuario();
	const empresaId = usuario?.empresaId;
	const { estados: estadosCaja } = useEstadoCaja(empresaId);
	const estadoCaja = estadosCaja.find((e) => e.abierta) ?? estadosCaja[0] ?? null;

	const [loading, setLoading] = useState(true);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<ErrorPagina | null>(null);
	const [intento, setIntento] = useState(0);
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
	const [ventasDia, setVentasDia] = useState<VentasHoyAyer | null>(null);

	const cargarDashboard = useCallback(
		async (empresaIdActual: number, signalCancelled: () => boolean) => {
			// LÍMITE ESTRICTO: Se reduce la carga de productos y clientes a 50 (suficientes para la métrica "nuevos hoy")
			const [resumenData, cajaData, flujoData, productosData, clientesData, ventasDiaData] = await Promise.all([
				dashboardService.obtenerResumen(empresaIdActual),
				cajaService.listarMovimientosPorEmpresa(empresaIdActual, 0, 50),
				cajaService.obtenerFlujoCajaDiario(empresaIdActual, 12).catch((e) => {
					console.error("Flujo de caja no disponible:", e);
					return [] as FlujoCajaDiario[];
				}),
				productoService.listarPorEmpresa(empresaIdActual, 0, 50),
				clienteService.listarPorEmpresa(empresaIdActual, 0, 50),
				cargarVentasHoyAyer(empresaIdActual).catch((e) => {
					console.error("Ventas de hoy no disponibles:", e);
					return null;
				})
			]);

			if (signalCancelled()) return;

			setResumen(resumenData);
			setMovimientosCaja(
				[...cajaData.content].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
			);
			setFlujoCajaDiario(flujoData);
			setProductos(productosData.content);
			setClientes(clientesData.content);
			setVentasDia(ventasDiaData);
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
			setError(errorSesion("dashboard"));
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
					setError(describirError("dashboard", err));
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [empresaId, intento]);

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
			if (!cancelled) setError(describirError("dashboard", err));
		});
		return () => {
			cancelled = true;
		};
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
		} catch (err) {
			setError(describirError("dashboard", err));
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

	const variacionClientes = useMemo(
		() => variacionNuevosHoy(contarEnDia(clientes.map((c) => c.createdAt), 0)),
		[clientes]
	);

	const variacionProductos = useMemo(
		() => variacionNuevosHoy(contarEnDia(productos.map((p) => p.createdAt), 0)),
		[productos]
	);

	const variacionVentas = useMemo(
		() => (ventasDia ? variacionVsAyer(ventasDia.hoy.total, ventasDia.ayer.total, formatCurrency) : undefined),
		[ventasDia]
	);

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

	const movimientosLayout: DataTableLayout<MovimientoUnificado> = {
		principal: (r) => r.concepto,
		secundario: (r) => formatDateShort(r.fecha),
		etiquetas: (r) => (r.formaPago ? <span className="ui-list__chip">{r.formaPago}</span> : null),
		estado: (r) => <StatusBadge status={etiquetaMovimiento(r.tipo, r.referencia)} />,
		valor: (r) => `${r.tipo === "INGRESO" ? "+" : "−"} ${formatCurrency(r.valor)}`
	};

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
				<ErrorState pagina="dashboard" error={error} onRetry={() => setIntento((n) => n + 1)} />
			</div>
		);
	}

	const nombreUsuario = usuario?.username ?? "";
	const stockBajo = resumen?.productosStockBajo ?? 0;

	return (
		<div className="db">
			<PageHeader
				title={`Bienvenido, ${nombreUsuario}`}
				subtitle="Resumen en tiempo real de la operación de tu negocio."
				actions={
					<>
						<AperturaCajaControl estado={estadoCaja} />
						<SecondaryButton type="button" disabled>
							Hoy
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleRecargar} disabled={reloading}>
							<RefreshCw size={14} strokeWidth={2} className={reloading ? "db__reloadIcon--spin" : ""} />
							<span>Recargar</span>
						</PrimaryButton>
					</>
				}
			/>

			<section className="db__metrics" aria-label="Indicadores">
				<StatCard
					icon={<ShoppingCart size={20} strokeWidth={1.8} />}
					title="Ventas de hoy"
					value={formatCurrency(ventasDia?.hoy.total ?? 0)}
					color="green"
					variation={variacionVentas}
				/>
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
					value={avisarStockBajo ? stockBajo.toLocaleString("es-CO") : "—"}
					color={avisarStockBajo ? (stockBajo > 0 ? "amber" : "green") : "blue"}
					footnote={avisarStockBajo ? undefined : "Avisos desactivados"}
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
				<DataTable
					title="Movimientos recientes"
					layout={movimientosLayout}
					data={movimientosUnificados}
					pageSize={10}
					emptyState={<span>No existen movimientos registrados.</span>}
				/>
			</section>
		</div>
	);
}