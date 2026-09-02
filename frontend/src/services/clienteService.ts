import { http } from "./http";

export type Cliente = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
};

export type ClienteCreateRequest = {
  empresaId: number;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
};

export type ClienteUpdateRequest = {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
};

export const clienteService = {
  async listar(page: number = 0, size: number = 20): Promise<{ content: Cliente[]; totalElements: number }> {
    const response = await http.get(`/api/clientes/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: Cliente[]; totalElements: number }> {
    const response = await http.get(`/api/clientes/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<Cliente> {
    const response = await http.get(`/api/clientes/${id}`);
    return response.data;
  },

  async crear(data: ClienteCreateRequest): Promise<Cliente> {
    const response = await http.post("/api/clientes/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: ClienteUpdateRequest): Promise<Cliente> {
    const response = await http.put(`/api/clientes/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/clientes/eliminar/${id}`);
  }
};
