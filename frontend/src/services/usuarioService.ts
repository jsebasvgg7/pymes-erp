import { http } from "./http";

export type UsuarioRolResumen = {
  id: number;
  nombre: string;
};

export type Usuario = {
  id: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  empresaId: number;
  username: string;
  email: string;
  roles: UsuarioRolResumen[];
};

export type UsuarioCreateRequest = {
  empresaId: number;
  username: string;
  email: string;
  password: string;
  rolIds?: number[];
};

export type UsuarioUpdateRequest = {
  username: string;
  email: string;
  password?: string;
  rolIds?: number[];
};

export const usuarioService = {
  async listar(page: number = 0, size: number = 20): Promise<{ content: Usuario[]; totalElements: number }> {
    const response = await http.get(`/api/usuarios/listar?page=${page}&size=${size}`);
    return response.data;
  },

  async listarPorEmpresa(empresaId: number, page: number = 0, size: number = 20): Promise<{ content: Usuario[]; totalElements: number }> {
    const response = await http.get(`/api/usuarios/listar-por-empresa/${empresaId}?page=${page}&size=${size}`);
    return response.data;
  },

  async obtenerPorId(id: number): Promise<Usuario> {
    const response = await http.get(`/api/usuarios/${id}`);
    return response.data;
  },

  async crear(data: UsuarioCreateRequest): Promise<Usuario> {
    const response = await http.post("/api/usuarios/crear", data);
    return response.data;
  },

  async actualizar(id: number, data: UsuarioUpdateRequest): Promise<Usuario> {
    const response = await http.put(`/api/usuarios/actualizar/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await http.delete(`/api/usuarios/eliminar/${id}`);
  },

  async cambiarEstado(id: number, active: boolean): Promise<void> {
    await http.patch(`/api/usuarios/cambiar-estado/${id}?active=${active}`);
  }
};
