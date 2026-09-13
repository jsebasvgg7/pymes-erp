import { http } from "./http";

export type TipoMovimientoInventario = "ENTRADA" | "SALIDA" | "CONTEO";

export type Inventario = {
  id: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean;
  empresaId: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  categoriaNombre: string | null;
  unidadMedida: string;
  cantidadActual: number;
  costoPromedio: number;
  stockMinimo: number;
  precioVenta: number;
  stockBajo: boolean;
};

export type AjusteStockRequest = {
  empresaId: number;
  productoId: number;
  usuarioId?: number;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  notas?: string;
};

export type MovimientoInventario = {
  id: number;
  createdAt: string;
  active: boolean;
  empresaId: number;
  productoId: number;
  productoNombre: string;
  usuarioId: number | null;
  usuarioUsername: string | null;
  tipo: TipoMovimientoInventario;
  cantidadAnterior: number;
  cantidadNueva: number;
  diferencia: number;
  motivo: string;
  notas: string | null;
};

export const inventarioService = {
  async listarPorEmpresa(empresaId: number): Promise<Inventario[]> {
    const response = await http.get<Inventario[]>(`/api/inventario/listar-por-empresa/${empresaId}`);
    return response.data;
  },

  async obtenerPorProducto(productoId: number): Promise<Inventario> {
    const response = await http.get<Inventario>(`/api/inventario/producto/${productoId}`);
    return response.data;
  },

  async ajustarStock(data: AjusteStockRequest): Promise<Inventario> {
    const response = await http.post<Inventario>("/api/inventario/ajustar", data);
    return response.data;
  },

  async obtenerMovimientosPorProducto(productoId: number): Promise<MovimientoInventario[]> {
    const response = await http.get<MovimientoInventario[]>(`/api/inventario/movimientos/producto/${productoId}`);
    return response.data;
  },

  async listarMovimientosPorEmpresa(
    empresaId: number,
    page: number = 0,
    size: number = 50
  ): Promise<{ content: MovimientoInventario[]; totalElements: number }> {
    const response = await http.get(`/api/inventario/movimientos/empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  }
};
