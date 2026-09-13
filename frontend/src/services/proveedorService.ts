import { http } from "./http";
import type { Page } from "./CategoriaProductoService";

export type Proveedor = {
	id: number;
	createdAt: string;
	updatedAt: string;
	active: boolean;
	empresaId: number;
	nombre: string;
	documento: string | null;
	telefono: string | null;
	email: string | null;
	direccion: string | null;
};

export type ProveedorCreateRequest = {
	empresaId: number;
	nombre: string;
	documento?: string;
	telefono?: string;
	email?: string;
	direccion?: string;
};

export type ProveedorUpdateRequest = {
	nombre: string;
	documento?: string;
	telefono?: string;
	email?: string;
	direccion?: string;
};

export const proveedorService = {
	async listar(pageable?: { page?: number; size?: number }): Promise<Page<Proveedor>> {
		const response = await http.get<Page<Proveedor>>("/api/proveedores/listar", {
			params: {
				page: pageable?.page ?? 0,
				size: pageable?.size ?? 200
			}
		});
		return response.data;
	},

	async listarPorEmpresa(empresaId: number, pageable?: { page?: number; size?: number }): Promise<Proveedor[]> {
		const response = await http.get<Page<Proveedor>>(`/api/proveedores/listar-por-empresa/${empresaId}`, {
			params: {
				page: pageable?.page ?? 0,
				size: pageable?.size ?? 200
			}
		});
		return response.data.content;
	},

	async obtenerPorId(id: number): Promise<Proveedor> {
		const response = await http.get<Proveedor>(`/api/proveedores/${id}`);
		return response.data;
	},

	async crear(data: ProveedorCreateRequest): Promise<Proveedor> {
		const response = await http.post<Proveedor>("/api/proveedores/crear", data);
		return response.data;
	},

	async actualizar(id: number, data: ProveedorUpdateRequest): Promise<Proveedor> {
		const response = await http.put<Proveedor>(`/api/proveedores/actualizar/${id}`, data);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await http.delete(`/api/proveedores/eliminar/${id}`);
	}
};
