export type EstadoCobertura = "Crítico" | "Atención" | "OK";

export type TipoTendencia = "sube" | "baja" | "estable" | "nuevo" | "baseBaja";

export type Tendencia = {
  tipo: TipoTendencia;
  porcentaje: number | null;
};

const DIAS_POR_SEMANA = 7;
const MARGEN_SEGURIDAD = 1.2;
const DIAS_CRITICO = 3;
const DIAS_ATENCION = 7;
const UMBRAL_TENDENCIA = 5;
const BASE_MINIMA = 5;
const UNIDADES_ENTERAS = new Set(["UNIDAD", "CAJA", "PAQUETE"]);

const etiquetasUnidad: Record<string, string> = {
  UNIDAD: "un.",
  KILOGRAMO: "kg",
  GRAMO: "g",
  LITRO: "L",
  MILILITRO: "ml",
  CAJA: "cajas",
  PAQUETE: "paq."
};

export function esUnidadEntera(unidad: string): boolean {
  return UNIDADES_ENTERAS.has(unidad);
}

export function etiquetaUnidad(unidad: string): string {
  return etiquetasUnidad[unidad] ?? unidad.toLowerCase();
}

export function calcularCobertura(stock: number, proyeccion: number): number | null {
  if (proyeccion <= 0) return null;
  return stock / (proyeccion / DIAS_POR_SEMANA);
}

export function estadoCobertura(dias: number | null): EstadoCobertura {
  if (dias === null) return "OK";
  if (dias < DIAS_CRITICO) return "Crítico";
  if (dias < DIAS_ATENCION) return "Atención";
  return "OK";
}

export function hayRiesgo(stock: number, proyeccion: number): boolean {
  return stock < proyeccion;
}

export function calcularReposicion(stock: number, proyeccion: number, unidad: string): number {
  const necesaria = Number((proyeccion * MARGEN_SEGURIDAD - stock).toFixed(6));
  if (necesaria <= 0) return 0;
  if (esUnidadEntera(unidad)) return Math.ceil(necesaria);
  return Number(necesaria.toFixed(1));
}

export function calcularTendencia(ventasSemanaAnterior: number, variacionPorcentual: number | null): Tendencia {
  if (variacionPorcentual === null || ventasSemanaAnterior <= 0) {
    return { tipo: "nuevo", porcentaje: null };
  }
  if (ventasSemanaAnterior < BASE_MINIMA) {
    return { tipo: "baseBaja", porcentaje: variacionPorcentual };
  }
  if (variacionPorcentual > UMBRAL_TENDENCIA) {
    return { tipo: "sube", porcentaje: variacionPorcentual };
  }
  if (variacionPorcentual < -UMBRAL_TENDENCIA) {
    return { tipo: "baja", porcentaje: variacionPorcentual };
  }
  return { tipo: "estable", porcentaje: variacionPorcentual };
}

function formatearNumero(valor: number, decimales: number): string {
  return valor.toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

export function formatearCantidad(valor: number, unidad: string): string {
  const decimales = esUnidadEntera(unidad) ? 0 : 1;
  return `${formatearNumero(valor, decimales)} ${etiquetaUnidad(unidad)}`;
}

export function formatearDias(dias: number | null): string {
  return dias === null ? "—" : `${formatearNumero(dias, 1)} días`;
}

export function formatearPorcentaje(valor: number): string {
  const signo = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${signo}${formatearNumero(Math.abs(valor), 1)} %`;
}