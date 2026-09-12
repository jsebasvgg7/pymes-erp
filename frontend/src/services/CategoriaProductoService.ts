import { http } from "./http";

export type Page<T> = {
	content: T[];
	totalElements: number;
	totalPages: number;
	number: number;
	size: number;
};

export type CategoriaProducto = {
	id: number;
	createdAt: string;
	updatedAt: string;
	active: boolean;
	empresaId: number;
	nombre: string;
};

export type CategoriaProductoCreateRequest = {
	empresaId: number;
	nombre: string;
};

export type CategoriaProductoUpdateRequest = {
	nombre: string;
};

export const categoriaProductoService = {
	async listar(pageable?: { page?: number; size?: number }): Promise<Page<CategoriaProducto>> {
		const response = await http.get<Page<CategoriaProducto>>("/api/categorias-producto/listar", {
			params: {
				page: pageable?.page ?? 0,
				size: pageable?.size ?? 200
			}
		});
		return response.data;
	},

	async listarPorEmpresa(empresaId: number, pageable?: { page?: number; size?: number }): Promise<CategoriaProducto[]> {
		const page = await this.listar(pageable);
		return page.content.filter((c) => c.empresaId === empresaId);
	},

	async obtenerPorId(id: number): Promise<CategoriaProducto> {
		const response = await http.get<CategoriaProducto>(`/api/categorias-producto/${id}`);
		return response.data;
	},

	async crear(data: CategoriaProductoCreateRequest): Promise<CategoriaProducto> {
		const response = await http.post<CategoriaProducto>("/api/categorias-producto/crear", data);
		return response.data;
	},

	async actualizar(id: number, data: CategoriaProductoUpdateRequest): Promise<CategoriaProducto> {
		const response = await http.put<CategoriaProducto>(`/api/categorias-producto/actualizar/${id}`, data);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await http.delete(`/api/categorias-producto/eliminar/${id}`);
	}
};
