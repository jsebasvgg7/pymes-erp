import type { PaginaClave } from "./erroresPagina";

export type ClaveCarga = PaginaClave | "generico";

const GENERICO: readonly string[] = [
  "Cargando tu información…",
  "Consultando los datos de tu negocio…",
  "Organizando la información…",
  "Esto puede tardar unos segundos si el sistema estuvo inactivo…",
  "Ya casi está listo…"
];

const FRASES: Record<ClaveCarga, readonly string[]> = {
  dashboard: [
    "Consultando tus ventas y movimientos…",
    "Calculando el saldo de tus cajas…",
    "Revisando los productos con poco stock…",
    "Armando las gráficas de tu negocio…",
    "Preparando tu resumen del día…"
  ],
  pronosticos: [
    "Revisando las ventas de las últimas semanas…",
    "Calculando cuánto se venderá esta semana…",
    "Comparando el stock con lo proyectado…",
    "Estimando cuántos días te alcanza cada producto…",
    "Calculando qué te conviene reponer…"
  ],
  pos: [
    "Preparando tu punto de venta…",
    "Cargando tus productos y precios…",
    "Revisando el stock disponible…",
    "Verificando el estado de la caja…",
    "Cargando tus clientes y formas de pago…"
  ],
  caja: [
    "Consultando tus cajas…",
    "Revisando los movimientos del día…",
    "Calculando los saldos…",
    "Buscando tus cierres anteriores…",
    "Preparando el control de caja…"
  ],
  inventario: [
    "Contando tus existencias…",
    "Revisando los productos con stock bajo…",
    "Consultando los últimos ajustes…",
    "Calculando las cantidades disponibles…",
    "Ordenando tu inventario…"
  ],
  compras: [
    "Consultando tus compras…",
    "Cargando tus proveedores…",
    "Revisando los productos de cada compra…",
    "Sumando los totales…",
    "Preparando el historial de compras…"
  ],
  productos: [
    "Cargando tu catálogo de productos…",
    "Revisando precios y costos…",
    "Consultando las categorías…",
    "Revisando el stock de cada producto…",
    "Ordenando tu lista…"
  ],
  categorias: [
    "Cargando tus categorías…",
    "Contando los productos de cada una…",
    "Revisando cuáles están activas…",
    "Ordenando tus categorías…",
    "Preparando tu vista…"
  ],
  clientes: [
    "Cargando tus clientes…",
    "Consultando los saldos pendientes…",
    "Revisando las deudas abiertas…",
    "Ordenando tu lista de clientes…",
    "Preparando tu vista…"
  ],
  proveedores: [
    "Cargando tus proveedores…",
    "Revisando sus datos de contacto…",
    "Consultando cuáles están activos…",
    "Ordenando tu lista…",
    "Preparando tu vista…"
  ],
  usuarios: [
    "Cargando tu equipo de trabajo…",
    "Consultando los roles asignados…",
    "Revisando quién está activo…",
    "Ordenando la lista de usuarios…",
    "Preparando tu vista…"
  ],
  reportes: [
    "Consultando tus ventas del periodo…",
    "Revisando tus compras…",
    "Contando los productos con poco inventario…",
    "Sumando los movimientos de caja…",
    "Armando tus reportes…"
  ],
  configuracion: [
    "Cargando los datos de tu empresa…",
    "Revisando tus preferencias…",
    "Consultando las opciones de venta y de recibo…",
    "Revisando el cierre automático de caja…",
    "Preparando tu configuración…"
  ],
  roles: GENERICO,
  generico: GENERICO
};

const RUTAS: Record<string, ClaveCarga> = {
  "/dashboard": "dashboard",
  "/clientes": "clientes",
  "/proveedores": "proveedores",
  "/productos": "productos",
  "/categorias": "categorias",
  "/compras": "compras",
  "/inventario": "inventario",
  "/pronosticos": "pronosticos",
  "/pos": "pos",
  "/caja": "caja",
  "/reportes": "reportes",
  "/configuracion": "configuracion",
  "/usuarios": "usuarios",
  "/roles": "roles"
};

export function frasesDe(clave: ClaveCarga): readonly string[] {
  return FRASES[clave];
}

export function paginaDesdeRuta(pathname: string): ClaveCarga {
  return RUTAS[pathname.replace(/\/+$/, "")] ?? "generico";
}
