import { http } from "./http";

export type DetalleFacturaRequest = {
  productoId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  impuestoIds?: number[];
};

export type FacturaVentaCreateRequest = {
  empresaId: number;
  clienteId?: number;
  formaPagoId: number;
  numero?: string;
  detalles: DetalleFacturaRequest[];
};

export type DetalleFacturaResponse = {
  id: number;
  productoId: number;
  productoNombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  totalLinea: number;
  impuestos: any[];
};

export type FacturaVentaResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  clienteId: number;
  clienteNombre: string;
  formaPagoId: number;
  formaPagoNombre: string;
  numero: string;
  fechaEmision: string;
  estado: string;
  subtotal: number;
  totalImpuestos: number;
  total: number;
  detalles: DetalleFacturaResponse[];
};

export type FacturaVentaUpdateRequest = {
  estado: string;
};

export const ventaService = {
  async listar(page: number = 0, size: number = 20): Promise<{ content: FacturaVentaResponse[]; totalElements: number }> {
    const response = await http.get(`/api/facturas-venta/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: FacturaVentaResponse[]; totalElements: number }> {
    const response = await http.get(`/api/facturas-venta/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<FacturaVentaResponse> {
    const response = await http.get(`/api/facturas-venta/${id}`);
    return response.data;
  },

  async crear(data: FacturaVentaCreateRequest): Promise<FacturaVentaResponse> {
    const response = await http.post("/api/facturas-venta/crear", data);
    return response.data;
  },

  async actualizarEstado(id: number, data: FacturaVentaUpdateRequest): Promise<FacturaVentaResponse> {
    const response = await http.patch(`/api/facturas-venta/actualizar-estado/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/facturas-venta/eliminar/${id}`);
  },

  async obtenerPorPeriodo(empresaId: number, inicio: string, fin: string): Promise<FacturaVentaResponse[]> {
    const response = await http.get(`/api/facturas-venta/por-periodo/${empresaId}?inicio=${inicio}&fin=${fin}`);
    return response.data;
  },

  async obtenerTotalPeriodo(empresaId: number, inicio: string, fin: string): Promise<number> {
    const response = await http.get(`/api/facturas-venta/total-ventas-periodo/${empresaId}?inicio=${inicio}&fin=${fin}`);
    return response.data;
  }
};
