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
  formaPagoId?: number;
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

export type CajaResumen = {
  cajaId: number;
  cajaNombre: string;
  saldoInicial: number;
  saldoActual: number;
  totalIngresos: number;
  totalEgresos: number;
  totalMovimientos: number;
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
    const response = await http.get(`/api/caja/movimientos/caja/${cajaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async listarMovimientosPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: MovimientoCajaResponse[]; totalElements: number }> {
    const response = await http.get(`/api/caja/movimientos/empresa/${empresaId}?page=${page}&size=${size}`);
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
  }
};