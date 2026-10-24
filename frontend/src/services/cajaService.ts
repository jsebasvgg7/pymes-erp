import { http } from "./http";

export type CajaCreateRequest = {
  empresaId: number;
  nombre: string;
  saldoInicial?: number;
};

export type Caja = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  nombre: string;
  saldoInicial: number;
  saldoActual: number;
};

export type MovimientoCajaRequest = {
  empresaId: number;
  cajaId: number;
  formaPagoId: number;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  descripcion?: string;
  tipoReferencia?: string;
  referenciaId?: number;
};

export type MovimientoCajaResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  cajaId: number;
  cajaNombre: string;
  formaPagoId: number;
  formaPagoNombre: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  descripcion: string;
  tipoReferencia: string;
  referenciaId: number;
};

export type FlujoCajaDiario = {
  fecha: string;
  ingreso: number;
  egreso: number;
};

export type CajaResumen = {
  cajaId: number;
  cajaNombre: string;
  saldoInicial: number;
  saldoActual: number;
  totalIngresos: number;
  totalEgresos: number;
  totalMovimientos: number;
};

export type EstadoApertura = "ABIERTA" | "CERRADA";
export type ResultadoCierre = "CUADRADA" | "FALTANTE" | "SOBRANTE";
export type TipoCierre = "MANUAL" | "AUTOMATICO";

export type AperturaCaja = {
  id: number;
  cajaId: number;
  cajaNombre: string;
  estado: EstadoApertura;
  usuarioAperturaId: number | null;
  usuarioAperturaNombre: string | null;
  fechaApertura: string;
  efectivoInicial: number;
  usuarioCierreId: number | null;
  usuarioCierreNombre: string | null;
  fechaCierre: string | null;
  efectivoEsperado: number | null;
  efectivoContado: number | null;
  diferencia: number | null;
  tipoCierre: TipoCierre | null;
  resultado: ResultadoCierre | null;
  requiereCierre: boolean;
};

export type EstadoCaja = {
  cajaId: number;
  cajaNombre: string;
  abierta: boolean;
  requiereCierre: boolean;
  apertura: AperturaCaja | null;
  efectivoSugerido: number | null;
};

export type CierreCajaResultado = {
  apertura: AperturaCaja;
  ingresosOtrosMedios: number;
  egresosOtrosMedios: number;
};

export const cajaService = {
  async crear(data: CajaCreateRequest): Promise<Caja> {
    const response = await http.post("/api/caja/crear", data);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number): Promise<Caja[]> {
    const response = await http.get(`/api/caja/listar-por-empresa/${empresaId}`);
    return response.data;
  },

  async listarMovimientos(page: number = 0, size: number = 20): Promise<{ content: MovimientoCajaResponse[]; totalElements: number }> {
    const response = await http.get(`/api/caja/movimientos/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarMovimientosPorCaja(cajaId: number, page: number = 0, size: number = 20): Promise<{ content: MovimientoCajaResponse[]; totalElements: number }> {
    const response = await http.get(`/api/caja/movimientos/caja/${cajaId}?page=${page}&size=${size}&sort=fecha,desc`);
    return response.data;
  },

  async listarMovimientosPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: MovimientoCajaResponse[]; totalElements: number; totalPages: number }> {
    const response = await http.get(`/api/caja/movimientos/empresa/${empresaId}?page=${page}&size=${size}&sort=fecha,desc`);
    return response.data;
  },

  async registrarMovimiento(data: MovimientoCajaRequest): Promise<MovimientoCajaResponse> {
    const response = await http.post("/api/caja/movimientos/registrar", data);
    return response.data;
  },

  async obtenerResumen(cajaId: number): Promise<CajaResumen> {
    const response = await http.get(`/api/caja/resumen/${cajaId}`);
    return response.data;
  },

  async obtenerResumenTodas(empresaId: number): Promise<CajaResumen[]> {
    const response = await http.get(`/api/caja/resumen-todas/${empresaId}`);
    return response.data;
  },

  async obtenerSaldo(cajaId: number): Promise<number> {
    const response = await http.get(`/api/caja/saldo/${cajaId}`);
    return response.data;
  },

  async obtenerFlujoCajaDiario(empresaId: number, mesesAtras?: number): Promise<FlujoCajaDiario[]> {
    const response = await http.get(`/api/caja/movimientos/flujo-diario/${empresaId}`, {
      params: mesesAtras ? { mesesAtras } : undefined
    });
    return response.data;
  },

  async obtenerEstados(empresaId: number): Promise<EstadoCaja[]> {
    const response = await http.get(`/api/caja/estados/${empresaId}`);
    return response.data;
  },

  async abrirCaja(cajaId: number, efectivoInicial: number): Promise<AperturaCaja> {
    const response = await http.post(`/api/caja/abrir/${cajaId}`, { efectivoInicial });
    return response.data;
  },

  async cerrarCaja(cajaId: number, efectivoContado: number): Promise<CierreCajaResultado> {
    const response = await http.post(`/api/caja/cerrar/${cajaId}`, { efectivoContado });
    return response.data;
  },

  async reabrirCaja(cajaId: number): Promise<AperturaCaja> {
    const response = await http.post(`/api/caja/reabrir/${cajaId}`);
    return response.data;
  },

  async listarCierres(cajaId: number, page: number = 0, size: number = 50): Promise<{ content: AperturaCaja[]; totalElements: number }> {
    const response = await http.get(`/api/caja/cierres/${cajaId}?page=${page}&size=${size}`);
    return response.data;
  }
};