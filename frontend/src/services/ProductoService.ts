import { http } from "./http";

export type Producto = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  categoriaId: number;
  categoriaNombre: string;
  sku: string;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  precioVenta: number;
  costo: number;
  stockMinimo: number;
  stockActual: number;
  costoPromedio: number;
  impuestos: any[];
};

export type ProductoCreateRequest = {
  empresaId: number;
  categoriaId?: number;
  sku?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  precioVenta: number;
  costo: number;
  stockMinimo: number;
  stockInicial: number;
  impuestoIds?: number[];
};

export type ProductoUpdateRequest = {
  nombre: string;
  descripcion?: string;
  unidadMedida?: string;
  precioVenta?: number;
  costo?: number;
  stockMinimo?: number;
  impuestoIds?: number[];
};

export const productoService = {
  async listar(page: number = 0, size: number = 20): Promise<{ content: Producto[]; totalElements: number }> {
    const response = await http.get(`/api/productos/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: Producto[]; totalElements: number }> {
    const response = await http.get(`/api/productos/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorCategoria(empresaId: number, categoriaId: number, page: number = 0, size: number = 20): Promise<{ content: Producto[]; totalElements: number }> {
    const response = await http.get(`/api/productos/listar-por-empresa-categoria/${empresaId}/${categoriaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<Producto> {
    const response = await http.get(`/api/productos/${id}`);
    return response.data;
  },

  async obtenerStockBajo(empresaId: number): Promise<Producto[]> {
    const response = await http.get(`/api/productos/stock-bajo/${empresaId}`);
    return response.data;
  },

  async obtenerSinStock(empresaId: number): Promise<Producto[]> {
    const response = await http.get(`/api/productos/sin-stock/${empresaId}`);
    return response.data;
  },

  async crear(data: ProductoCreateRequest): Promise<Producto> {
    const response = await http.post("/api/productos/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: ProductoUpdateRequest): Promise<Producto> {
    const response = await http.put(`/api/productos/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/productos/eliminar/${id}`);
  }
};
