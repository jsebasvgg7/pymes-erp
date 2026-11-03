import { lazy } from "react";

const cargarDashboard = () => import("../pages/DashboardPage");
const cargarClientes = () => import("../pages/ClientesPage");
const cargarCategorias = () => import("../pages/CategoriasPage");
const cargarCompras = () => import("../pages/ComprasPage");
const cargarCaja = () => import("../pages/CajaPage");
const cargarInventario = () => import("../pages/InventarioPage");
const cargarPronosticos = () => import("../pages/PronosticosPage");
const cargarPos = () => import("../pages/PosPage");
const cargarReportes = () => import("../pages/ReportesPage");
const cargarConfiguracion = () => import("../pages/ConfiguracionPage");
const cargarUsuarios = () => import("../pages/UsuariosPage");
const cargarProductos = () => import("../pages/ProductosPage");
const cargarProveedores = () => import("../pages/ProveedoresPage");
const cargarRoles = () => import("../pages/RolesPage");
const cargarSetup = () => import("../pages/SetupPage");

export const DashboardPage = lazy(cargarDashboard);
export const ClientesPage = lazy(cargarClientes);
export const CategoriasPage = lazy(cargarCategorias);
export const ComprasPage = lazy(cargarCompras);
export const CajaPage = lazy(cargarCaja);
export const InventarioPage = lazy(cargarInventario);
export const PronosticosPage = lazy(cargarPronosticos);
export const PosPage = lazy(cargarPos);
export const ReportesPage = lazy(cargarReportes);
export const ConfiguracionPage = lazy(cargarConfiguracion);
export const UsuariosPage = lazy(cargarUsuarios);
export const ProductosPage = lazy(cargarProductos);
export const ProveedoresPage = lazy(cargarProveedores);
export const RolesPage = lazy(cargarRoles);
export const SetupPage = lazy(cargarSetup);

const cargadoresPorRuta: Record<string, () => Promise<unknown>> = {
  "/dashboard": cargarDashboard,
  "/clientes": cargarClientes,
  "/proveedores": cargarProveedores,
  "/productos": cargarProductos,
  "/categorias": cargarCategorias,
  "/compras": cargarCompras,
  "/inventario": cargarInventario,
  "/pronosticos": cargarPronosticos,
  "/pos": cargarPos,
  "/caja": cargarCaja,
  "/reportes": cargarReportes,
  "/configuracion": cargarConfiguracion,
  "/usuarios": cargarUsuarios,
  "/roles": cargarRoles,
};

const rutasPrecargadas = new Set<string>();

export function precargarRuta(href: string) {
  const ruta = href.split(/[?#]/)[0].replace(/\/+$/, "");
  const cargar = cargadoresPorRuta[ruta];
  if (!cargar || rutasPrecargadas.has(ruta)) return;
  rutasPrecargadas.add(ruta);
  cargar().catch(() => rutasPrecargadas.delete(ruta));
}
