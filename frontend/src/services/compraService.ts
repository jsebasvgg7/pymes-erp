import { http } from "./http";

export type DetalleCompraRequest = {
  productoId?: number;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  impuestoIds?: number[];
};

export type CompraCreateRequest = {
  empresaId: number;
  proveedorId: number;
  formaPagoId?: number;
  numeroDocumento?: string;
  fechaCompra?: string;
  detalles: DetalleCompraRequest[];
};

export type DetalleCompraResponse = {
  id: number;
  productoId: number;
  productoNombre: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  totalLinea: number;
  impuestos: any[];
};

export type CompraResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  proveedorId: number;
  proveedorNombre: string;
  formaPagoId: number;
  formaPagoNombre: string;
  numeroDocumento: string;
  fechaCompra: string;
  fechaVencimiento: string;
  estado: string;
  subtotal: number;
  totalImpuestos: number;
  total: number;
  detalles: DetalleCompraResponse[];
};

export type CompraUpdateRequest = {
  estado?: string;
  fechaVencimiento?: string;
};

export const compraService = {
  async listar(page: number = 0, size: number = 20): Promise<{ content: CompraResponse[]; totalElements: number }> {
    const response = await http.get(`/api/compras/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: CompraResponse[]; totalElements: number }> {
    const response = await http.get(`/api/compras/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorProveedor(empresaId: number, proveedorId: number, page: number = 0, size: number = 20): Promise<{ content: CompraResponse[]; totalElements: number }> {
    const response = await http.get(`/api/compras/listar-por-empresa-proveedor/${empresaId}/${proveedorId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<CompraResponse> {
    const response = await http.get(`/api/compras/${id}`);
    return response.data;
  },

  async crear(data: CompraCreateRequest): Promise<CompraResponse> {
    const response = await http.post("/api/compras/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: CompraUpdateRequest): Promise<CompraResponse> {
    const response = await http.put(`/api/compras/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/compras/eliminar/${id}`);
  },

  async obtenerPorPeriodo(empresaId: number, inicio: string, fin: string): Promise<CompraResponse[]> {
    const response = await http.get(`/api/compras/por-periodo/${empresaId}?inicio=${inicio}&fin=${fin}`);
    return response.data;
  },

  async obtenerTotalPeriodo(empresaId: number, inicio: string, fin: string): Promise<number> {
    const response = await http.get(`/api/compras/total-compras-periodo/${empresaId}?inicio=${inicio}&fin=${fin}`);
    return response.data;
  }
};
