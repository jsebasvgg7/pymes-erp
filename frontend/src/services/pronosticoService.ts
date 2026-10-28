import { http } from "./http";

export type PronosticoProducto = {
  id: number;
  nombre: string;
  codigo: string | null;
};

export type PronosticoDemanda = {
  id: number;
  producto: PronosticoProducto;
  semanaPronosticada: string;
  unidadesProyectadas: number;
  ventasSemanaAnterior: number;
  variacionPorcentual: number | null;
  fechaCalculo: string;
};

export const pronosticoService = {
  async obtenerPronosticos(empresaId: number): Promise<PronosticoDemanda[]> {
    const response = await http.get<PronosticoDemanda[]>(`/api/pronosticos/empresa/${empresaId}`);
    return response.data;
  },

  async recalcularPronosticos(empresaId: number): Promise<void> {
    await http.post(`/api/pronosticos/empresa/${empresaId}/recalcular`);
  }
};