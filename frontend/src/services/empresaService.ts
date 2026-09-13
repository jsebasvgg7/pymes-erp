import { http } from "./http";

export type Empresa = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
};

export type EmpresaUpdateRequest = {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
};

export const empresaService = {
  async obtenerPorId(id: number): Promise<Empresa> {
    const response = await http.get(`/api/empresas/${id}`);
    return response.data;
  },

  async actualizar(id: number, data: EmpresaUpdateRequest): Promise<Empresa> {
    const response = await http.put(`/api/empresas/actualizar/${id}`, data);
    return response.data;
  }
};
