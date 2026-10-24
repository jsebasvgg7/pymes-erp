import { http } from "./http";
import type { FormatoFecha } from "../utils/formatoConfig";

export type Configuracion = {
	empresaId: number;
	updatedAt: string;
	moneda: string;
	simboloMoneda: string;
	formatoFecha: FormatoFecha;
	clienteObligatorio: boolean;
	diasVencimientoCredito: number | null;
	codigoBarrasActivo: boolean;
	stockMinimoDefecto: number;
	avisarStockBajo: boolean;
	horaCierreAutomatico: string;
	anchoRecibo: number;
	nombreRecibo: string | null;
	mensajePieRecibo: string | null;
};

export type ConfiguracionUpdateRequest = Partial<Omit<Configuracion, "empresaId" | "updatedAt">>;

export const configuracionService = {
	async obtener(empresaId: number): Promise<Configuracion> {
		const response = await http.get(`/api/configuracion/${empresaId}`);
		return response.data;
	},

	async actualizar(empresaId: number, data: ConfiguracionUpdateRequest): Promise<Configuracion> {
		const response = await http.put(`/api/configuracion/${empresaId}`, data);
		return response.data;
	}
};
