import { http } from "./http";

export type DashboardResumen = {
  totalClientes: number;
  totalProveedores: number;
  totalProductos: number;
  productosStockBajo: number;
  productosSinStock: number;
  totalCajas: number;
  saldoTotalCajas: number;
  cajas: Array<{
    cajaId: number;
    cajaNombre: string;
    saldoInicial: number;
    saldoActual: number;
    totalIngresos: number;
    totalEgresos: number;
    totalMovimientos: number;
  }>;
  fechaConsulta: string;
};

export const dashboardService = {
  async obtenerResumen(empresaId: number): Promise<DashboardResumen> {
    const response = await http.get(`/api/dashboard/resumen/${empresaId}`);
    return response.data;
  }
};
