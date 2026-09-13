import { http } from "./http";

export type Rol = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  nombre: string;
  descripcion: string;
};

export type RolCreateRequest = {
  empresaId: number;
  nombre: string;
  descripcion?: string;
};

export type RolUpdateRequest = {
  nombre: string;
  descripcion?: string;
};

export const rolService = {
  async listar(page: number = 0, size: number = 50): Promise<{ content: Rol[]; totalElements: number }> {
    const response = await http.get(`/api/roles/listar?page=${page}&size=${size}`);
    return response.data;
  },

  // NOTA: el backend no expone /listar-por-empresa/{id} para roles (igual que
  // formaPagoService, ver bitácora sesión 8) — /listar devuelve los de TODAS
  // las empresas. Filtramos aquí mientras no exista un endpoint dedicado.
  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 50): Promise<{ content: Rol[]; totalElements: number }> {
    const response = await http.get(`/api/roles/listar?page=${page}&size=${size}`);
    const data = response.data as { content: Rol[]; totalElements: number };
    return { ...data, content: data.content.filter((r) => r.empresaId === empresaId) };
  },

  async obtenerPorId(id: number): Promise<Rol> {
    const response = await http.get(`/api/roles/${id}`);
    return response.data;
  },

  async crear(data: RolCreateRequest): Promise<Rol> {
    const response = await http.post("/api/roles/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: RolUpdateRequest): Promise<Rol> {
    const response = await http.put(`/api/roles/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/roles/eliminar/${id}`);
  }
};
