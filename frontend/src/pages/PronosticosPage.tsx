import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpDown, ArrowUpRight, ChevronDown, ChevronUp, Info, Minus, RefreshCw } from "lucide-react";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { inventarioService, type Inventario } from "../services/inventarioService";
import { pronosticoService, type PronosticoDemanda } from "../services/pronosticoService";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import { formatDateTime, useFormato } from "../utils/formatoConfig";
import {
  calcularCobertura,
  calcularReposicion,
  calcularTendencia,
  estadoCobertura,
  formatearCantidad,
  formatearDias,
  formatearPorcentaje,
  hayRiesgo,
  type EstadoCobertura,
  type Tendencia
} from "../utils/pronosticos";
import "./PronosticosPage.css";

const FILAS_POR_PAGINA = 20;

type Orden = "ninguno" | "desc" | "asc";

type Fila = {
  productoId: number;
  nombre: string;
  codigo: string | null;
  unidad: string;
  stock: number;
  pronostico: PronosticoDemanda | null;
  proyeccion: number;
  ventasAnterior: number;
  tendencia: Tendencia;
  cobertura: number | null;
  estado: EstadoCobertura;
  riesgo: boolean;
  reponer: number;
};

function construirFilas(inventarios: Inventario[], pronosticos: PronosticoDemanda[]): Fila[] {
  const porProducto = new Map(pronosticos.map((p) => [p.producto.id, p]));

  return inventarios.map((inv) => {
    const pronostico = porProducto.get(inv.productoId) ?? null;
    const proyeccion = pronostico?.unidadesProyectadas ?? 0;
    const cobertura = pronostico ? calcularCobertura(inv.cantidadActual, proyeccion) : null;

    return {
      productoId: inv.productoId,
      nombre: inv.productoNombre,
      codigo: inv.productoSku,
      unidad: inv.unidadMedida,
      stock: inv.cantidadActual,
      pronostico,
      proyeccion,
      ventasAnterior: pronostico?.ventasSemanaAnterior ?? 0,
      tendencia: pronostico
        ? calcularTendencia(pronostico.ventasSemanaAnterior, pronostico.variacionPorcentual)
        : { tipo: "nuevo", porcentaje: null },
      cobertura,
      estado: estadoCobertura(cobertura),
      riesgo: pronostico ? hayRiesgo(inv.cantidadActual, proyeccion) : false,
      reponer: pronostico ? calcularReposicion(inv.cantidadActual, proyeccion, inv.unidadMedida) : 0
    };
  });
}

function ordenarFilas(filas: Fila[], orden: Orden): Fila[] {
  const base = [...filas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const conDatos = base.filter((f) => f.pronostico);
  const sinDatos = base.filter((f) => !f.pronostico);

  if (orden !== "ninguno") {
    conDatos.sort((a, b) => {
      const pa = a.tendencia.porcentaje;
      const pb = b.tendencia.porcentaje;
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return orden === "desc" ? pb - pa : pa - pb;
    });
  }

  return [...conDatos, ...sinDatos];
}

function leerFechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function diaYMes(fecha: Date): string {
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function describirSemana(inicioIso: string): string {
  const inicio = leerFechaLocal(inicioIso);
  const fin = sumarDias(inicio, 6);
  const anteriorInicio = sumarDias(inicio, -7);
  const anteriorFin = sumarDias(inicio, -1);
  return `Proyección de la semana del ${diaYMes(inicio)} al ${diaYMes(fin)} de ${fin.getFullYear()}, comparada con la semana del ${diaYMes(anteriorInicio)} al ${diaYMes(anteriorFin)}.`;
}

function textoUltimoCalculo(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime()) || fecha.toDateString() !== new Date().toDateString()) {
    return formatDateTime(iso);
  }
  return `Hoy, ${fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}`;
}

function nombreUnidad(unidad: string): string {
  return unidad.charAt(0) + unidad.slice(1).toLowerCase();
}

function extraerMensaje(err: unknown, respaldo: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return respaldo;
}

function CeldaTendencia({ tendencia }: { tendencia: Tendencia }) {
  if (tendencia.tipo === "nuevo") {
    return <span className="pro__trend pro__trend--neutral">Nuevo</span>;
  }
  if (tendencia.tipo === "baseBaja") {
    return <span className="pro__trend pro__trend--neutral">Base baja</span>;
  }

  const Icono = tendencia.tipo === "sube" ? ArrowUpRight : tendencia.tipo === "baja" ? ArrowDownRight : Minus;
  return (
    <span className={`pro__trend pro__trend--${tendencia.tipo}`}>
      <Icono size={13} strokeWidth={2.25} aria-hidden="true" />
      {formatearPorcentaje(tendencia.porcentaje ?? 0)}
    </span>
  );
}

export default function PronosticosPage() {
  useFormato();
  const empresaId = authService.getUsuario()?.empresaId;

  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [pronosticos, setPronosticos] = useState<PronosticoDemanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorPagina | null>(null);
  const [recalculando, setRecalculando] = useState(false);
  const [avisoError, setAvisoError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [orden, setOrden] = useState<Orden>("ninguno");
  const [pagina, setPagina] = useState(0);

  const cargar = useCallback(async () => {
    if (!empresaId) {
      setError(errorSesion("pronosticos"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [inventarioData, pronosticoData] = await Promise.all([
        inventarioService.listarPorEmpresa(empresaId),
        pronosticoService.obtenerPronosticos(empresaId)
      ]);
      setInventarios(inventarioData);
      setPronosticos(pronosticoData);
    } catch (err) {
      setError(describirError("pronosticos", err));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const recalcular = useCallback(async () => {
    if (!empresaId || recalculando) return;

    setRecalculando(true);
    setAvisoError(null);
    try {
      await pronosticoService.recalcularPronosticos(empresaId);
      setPronosticos(await pronosticoService.obtenerPronosticos(empresaId));
    } catch (err) {
      setAvisoError(extraerMensaje(err, "No se pudo recalcular. Intenta nuevamente."));
    } finally {
      setRecalculando(false);
    }
  }, [empresaId, recalculando]);

  const alternarOrden = useCallback(() => {
    setOrden((actual) => (actual === "ninguno" ? "desc" : actual === "desc" ? "asc" : "ninguno"));
  }, []);

  const filas = useMemo(() => construirFilas(inventarios, pronosticos), [inventarios, pronosticos]);

  const resumen = useMemo(
    () => ({
      riesgo: filas.filter((f) => f.riesgo).length,
      suben: filas.filter((f) => f.pronostico && f.tendencia.tipo === "sube").length,
      bajan: filas.filter((f) => f.pronostico && f.tendencia.tipo === "baja").length,
      sinDatos: filas.filter((f) => !f.pronostico).length
    }),
    [filas]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtradas = filas.filter((f) => {
      const coincide =
        q.length === 0 || f.nombre.toLowerCase().includes(q) || (f.codigo?.toLowerCase().includes(q) ?? false);
      return coincide && (!soloRiesgo || f.riesgo);
    });
    return ordenarFilas(filtradas, orden);
  }, [filas, busqueda, soloRiesgo, orden]);

  useEffect(() => {
    setPagina(0);
  }, [busqueda, soloRiesgo, orden]);

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const desde = paginaActual * FILAS_POR_PAGINA;
  const hasta = Math.min(desde + FILAS_POR_PAGINA, visibles.length);
  const filasPagina = useMemo(() => visibles.slice(desde, desde + FILAS_POR_PAGINA), [visibles, desde]);

  const semana = useMemo(() => {
    if (pronosticos.length === 0) return null;
    return pronosticos.reduce((max, p) => (p.semanaPronosticada > max ? p.semanaPronosticada : max), pronosticos[0].semanaPronosticada);
  }, [pronosticos]);

  const ultimoCalculo = useMemo(() => {
    if (pronosticos.length === 0) return null;
    return pronosticos.reduce((max, p) => (p.fechaCalculo > max ? p.fechaCalculo : max), pronosticos[0].fechaCalculo);
  }, [pronosticos]);

  if (loading) {
    return (
      <div className="pro">
        <LoadingState label="Cargando pronósticos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pro">
        <ErrorState pagina="pronosticos" error={error} onRetry={cargar} />
      </div>
    );
  }

  const IconoOrden = orden === "desc" ? ChevronDown : orden === "asc" ? ChevronUp : ArrowUpDown;

  return (
    <div className="pro">
      <PageHeader
        title="Pronósticos"
        subtitle={semana ? describirSemana(semana) : "Proyección de la demanda de la semana en curso por producto."}
        actions={
          <>
            <div className="pro__lastCalc">
              <span className="pro__lastCalcLabel">Último cálculo</span>
              <span className="pro__lastCalcValue">{ultimoCalculo ? textoUltimoCalculo(ultimoCalculo) : "Sin calcular"}</span>
            </div>
            <PrimaryButton type="button" onClick={recalcular} disabled={recalculando}>
              <RefreshCw size={14} strokeWidth={2} className={recalculando ? "pro__spin" : undefined} aria-hidden="true" />
              {recalculando ? "Recalculando..." : "Recalcular"}
            </PrimaryButton>
          </>
        }
      />

      {avisoError ? (
        <div className="pro__alert" role="alert">
          {avisoError}
        </div>
      ) : null}

      <div className="pro__cards">
        <article className="pro__card">
          <div className="pro__cardLabel">Productos en riesgo</div>
          <div className="pro__cardValue">{resumen.riesgo}</div>
          <div className="pro__cardText">Su stock no cubre la proyección de la semana</div>
        </article>
        <article className="pro__card">
          <div className="pro__cardLabel">Subirán</div>
          <div className="pro__cardValue pro__cardValue--up">{resumen.suben}</div>
          <div className="pro__cardText">Más de 5 % frente a la semana pasada</div>
        </article>
        <article className="pro__card">
          <div className="pro__cardLabel">Bajarán</div>
          <div className="pro__cardValue pro__cardValue--down">{resumen.bajan}</div>
          <div className="pro__cardText">Menos de 5 % frente a la semana pasada</div>
        </article>
        <article className="pro__card">
          <div className="pro__cardLabel">Sin datos suficientes</div>
          <div className="pro__cardValue">{resumen.sinDatos}</div>
          <div className="pro__cardText">Menos de 8 semanas de historial</div>
        </article>
      </div>

      <section className="pro__panel" aria-label="Pronóstico por producto">
        <div className="pro__toolbar">
          <div className="pro__search">
            <SearchBar placeholder="Buscar producto o código" value={busqueda} onChange={setBusqueda} />
          </div>
          <SecondaryButton
            type="button"
            className={soloRiesgo ? "pro__toggle pro__toggle--on" : "pro__toggle"}
            aria-pressed={soloRiesgo}
            onClick={() => setSoloRiesgo((v) => !v)}
          >
            <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
            Solo en riesgo
          </SecondaryButton>
          <span className="pro__count">
            {visibles.length.toLocaleString("es-CO")} de {filas.length.toLocaleString("es-CO")} productos
          </span>
        </div>

        {filas.length > 0 && pronosticos.length === 0 ? (
          <div className="pro__notice">
            <Info size={16} strokeWidth={1.8} aria-hidden="true" />
            Todavía no hay pronósticos calculados. Pulsa Recalcular para generarlos.
          </div>
        ) : null}

        {filas.length === 0 ? (
          <div className="pro__empty">
            <div className="pro__emptyTitle">No hay productos registrados.</div>
            <div className="pro__emptyText">Crea productos y registra ventas para recibir pronósticos.</div>
          </div>
        ) : visibles.length === 0 ? (
          <div className="pro__empty">
            <div className="pro__emptyTitle">No se encontraron productos.</div>
            <div className="pro__emptyText">Prueba modificando la búsqueda o el filtro.</div>
          </div>
        ) : (
          <div className="pro__tableWrap">
            <table className="pro__table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Semana pasada</th>
                  <th scope="col">Próxima semana</th>
                  <th scope="col" aria-sort={orden === "desc" ? "descending" : orden === "asc" ? "ascending" : "none"}>
                    <button type="button" className="pro__sort" onClick={alternarOrden}>
                      Tendencia
                      <IconoOrden size={13} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </th>
                  <th scope="col">Stock actual</th>
                  <th scope="col">Cobertura</th>
                  <th scope="col">Reponer</th>
                </tr>
              </thead>
              <tbody>
                {filasPagina.map((f) => (
                  <tr key={f.productoId}>
                    <td>
                      <div className="pro__name">{f.nombre}</div>
                      <div className="pro__meta">
                        {f.codigo ?? "Sin código"} · {nombreUnidad(f.unidad)}
                      </div>
                    </td>
                    {f.pronostico ? (
                      <>
                        <td className="pro__muted">{formatearCantidad(f.ventasAnterior, f.unidad)}</td>
                        <td className="pro__strong">{formatearCantidad(f.proyeccion, f.unidad)}</td>
                        <td>
                          <CeldaTendencia tendencia={f.tendencia} />
                        </td>
                        <td>{formatearCantidad(f.stock, f.unidad)}</td>
                        <td>
                          <div className="pro__coverage">
                            <StatusBadge status={f.estado} />
                            <span className="pro__days">{formatearDias(f.cobertura)}</span>
                          </div>
                        </td>
                        <td className="pro__strong">{f.reponer > 0 ? formatearCantidad(f.reponer, f.unidad) : "—"}</td>
                      </>
                    ) : (
                      <td colSpan={6}>
                        <span className="pro__noData">
                          <Info size={16} strokeWidth={1.8} aria-hidden="true" />
                          Sin datos suficientes
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {visibles.length > FILAS_POR_PAGINA ? (
          <div className="pro__pagination" aria-label="Paginación de resultados">
            <span aria-live="polite">
              Mostrando {(desde + 1).toLocaleString("es-CO")}–{hasta.toLocaleString("es-CO")} de {visibles.length.toLocaleString("es-CO")}
            </span>
            <div className="pro__pageControls">
              <button type="button" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 0}>
                Anterior
              </button>
              <span>
                Página {paginaActual + 1} de {totalPaginas}
              </span>
              <button type="button" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas - 1}>
                Siguiente
              </button>
            </div>
          </div>
        ) : null}

        <div className="pro__legend">
          <p>
            <strong className="pro__legendUp">Verde:</strong> la proyección sube más de 5 %.{" "}
            <strong className="pro__legendDown">Rojo:</strong> baja más de 5 %. <strong>Gris:</strong> estable (entre −5 % y +5 %).
          </p>
          <p>Cobertura: días de stock al ritmo proyectado. Crítico menos de 3, Atención menos de 7, OK 7 o más.</p>
        </div>
      </section>
    </div>
  );
}
