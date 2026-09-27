import { http } from "./http";

export type FormaPago = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  nombre: string;
  tipo: string;
};

export type FormaPagoCreateRequest = {
  empresaId: number;
  nombre: string;
  tipo: string;
};

export type FormaPagoUpdateRequest = {
  nombre?: string;
  tipo?: string;
};

export const formaPagoService = {
  async listar(page: number = 0, size: number = 50): Promise<{ content: FormaPago[]; totalElements: number }> {
    const response = await http.get(`/api/formas-pago/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 50): Promise<{ content: FormaPago[]; totalElements: number }> {
    const response = await http.get(`/api/formas-pago/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<FormaPago> {
    const response = await http.get(`/api/formas-pago/${id}`);
    return response.data;
  },

  async crear(data: FormaPagoCreateRequest): Promise<FormaPago> {
    const response = await http.post("/api/formas-pago/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: FormaPagoUpdateRequest): Promise<FormaPago> {
    const response = await http.put(`/api/formas-pago/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/formas-pago/eliminar/${id}`);
  }
};