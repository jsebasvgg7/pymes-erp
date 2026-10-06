import {
	FileBarChart,
	FolderTree,
	LayoutDashboard,
	LogOut,
	Monitor,
	Package,
	Plus,
	Settings,
	ShoppingCart,
	Truck,
	UserCog,
	Users,
	Wallet,
	Warehouse,
	type LucideIcon
} from "lucide-react";

export type CommandGroup = "Acciones" | "Páginas";

export type CommandEntry = {
	id: string;
	label: string;
	group: CommandGroup;
	icon: LucideIcon;
	keywords: string;
	hint: string;
	path?: string;
	accion?: "logout";
};

export const ATAJO_BUSQUEDA =
	typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent) ? "⌘ K" : "Ctrl K";

const COMANDOS: CommandEntry[] = [
	{
		id: "accion-nueva-venta",
		label: "Nueva venta",
		group: "Acciones",
		icon: Monitor,
		keywords: "vender cobrar factura recibo carrito pos punto de venta",
		hint: "Ventas (POS)",
		path: "/pos"
	},
	{
		id: "accion-crear-producto",
		label: "Crear producto",
		group: "Acciones",
		icon: Plus,
		keywords: "nuevo agregar articulo costo unidad de medida stock minimo",
		hint: "Productos",
		path: "/productos?accion=nuevo"
	},
	{
		id: "accion-crear-categoria",
		label: "Crear categoría",
		group: "Acciones",
		icon: Plus,
		keywords: "nueva agregar clasificacion grupo",
		hint: "Categorías",
		path: "/categorias?accion=nuevo"
	},
	{
		id: "accion-crear-cliente",
		label: "Crear cliente",
		group: "Acciones",
		icon: Plus,
		keywords: "nuevo agregar comprador",
		hint: "Clientes",
		path: "/clientes?accion=nuevo"
	},
	{
		id: "accion-crear-proveedor",
		label: "Crear proveedor",
		group: "Acciones",
		icon: Plus,
		keywords: "nuevo agregar surtidor",
		hint: "Proveedores",
		path: "/proveedores?accion=nuevo"
	},
	{
		id: "accion-registrar-compra",
		label: "Registrar compra",
		group: "Acciones",
		icon: Plus,
		keywords: "nueva comprar mercancia abastecer ingreso de inventario forma de pago",
		hint: "Compras",
		path: "/compras?accion=nuevo"
	},
	{
		id: "accion-movimiento-caja",
		label: "Registrar movimiento de caja",
		group: "Acciones",
		icon: Plus,
		keywords: "nuevo ingreso egreso efectivo gasto retiro",
		hint: "Caja",
		path: "/caja?accion=movimiento"
	},
	{
		id: "accion-crear-caja",
		label: "Crear caja",
		group: "Acciones",
		icon: Plus,
		keywords: "nueva abrir apertura",
		hint: "Caja",
		path: "/caja?accion=nueva-caja"
	},
	{
		id: "accion-crear-usuario",
		label: "Crear usuario",
		group: "Acciones",
		icon: Plus,
		keywords: "nuevo agregar empleado cuenta rol permisos contrasena",
		hint: "Usuarios",
		path: "/usuarios?accion=nuevo"
	},
	{
		id: "accion-cerrar-sesion",
		label: "Cerrar sesión",
		group: "Acciones",
		icon: LogOut,
		keywords: "salir logout desconectar",
		hint: "Cuenta",
		accion: "logout"
	},
	{
		id: "pagina-dashboard",
		label: "Dashboard",
		group: "Páginas",
		icon: LayoutDashboard,
		keywords: "inicio resumen estadisticas graficas flujo de caja ventas por categoria movimientos recientes saldo",
		hint: "General",
		path: "/dashboard"
	},
	{
		id: "pagina-pos",
		label: "Ventas (POS)",
		group: "Páginas",
		icon: Monitor,
		keywords: "vender venta factura cobrar punto de venta recibo carrito descuento",
		hint: "Operación",
		path: "/pos"
	},
	{
		id: "pagina-caja",
		label: "Caja",
		group: "Páginas",
		icon: Wallet,
		keywords: "cajas efectivo apertura movimientos ingreso egreso saldo",
		hint: "Operación",
		path: "/caja"
	},
	{
		id: "pagina-inventario",
		label: "Inventario",
		group: "Páginas",
		icon: Warehouse,
		keywords: "stock existencias ajuste entrada salida conteo historial bajo stock",
		hint: "Operación",
		path: "/inventario"
	},
	{
		id: "pagina-compras",
		label: "Compras",
		group: "Páginas",
		icon: ShoppingCart,
		keywords: "comprar proveedor mercancia egreso forma de pago",
		hint: "Operación",
		path: "/compras"
	},
	{
		id: "pagina-productos",
		label: "Productos",
		group: "Páginas",
		icon: Package,
		keywords: "articulos catalogo costo unidad de medida stock minimo",
		hint: "Catálogo",
		path: "/productos"
	},
	{
		id: "pagina-categorias",
		label: "Categorías",
		group: "Páginas",
		icon: FolderTree,
		keywords: "clasificacion grupos reactivar",
		hint: "Catálogo",
		path: "/categorias"
	},
	{
		id: "pagina-clientes",
		label: "Clientes",
		group: "Páginas",
		icon: Users,
		keywords: "compradores cuentas por cobrar",
		hint: "Catálogo",
		path: "/clientes"
	},
	{
		id: "pagina-proveedores",
		label: "Proveedores",
		group: "Páginas",
		icon: Truck,
		keywords: "surtidores cuentas por pagar",
		hint: "Catálogo",
		path: "/proveedores"
	},
	{
		id: "pagina-reportes",
		label: "Reportes",
		group: "Páginas",
		icon: FileBarChart,
		keywords: "informes exportar csv excel ventas compras stock bajo periodo fechas desde hasta",
		hint: "Administración",
		path: "/reportes"
	},
	{
		id: "pagina-usuarios",
		label: "Usuarios",
		group: "Páginas",
		icon: UserCog,
		keywords: "roles permisos cuentas empleados administrador",
		hint: "Administración",
		path: "/usuarios"
	},
	{
		id: "pagina-configuracion",
		label: "Configuración",
		group: "Páginas",
		icon: Settings,
		keywords: "empresa negocio datos ajustes",
		hint: "Administración",
		path: "/configuracion"
	}
];

const ORDEN_GRUPOS: CommandGroup[] = ["Acciones", "Páginas"];

function normalizar(texto: string) {
	return texto
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

const INDICE = COMANDOS.map((entry, posicion) => {
	const label = normalizar(entry.label);
	return {
		entry,
		posicion,
		label,
		palabras: label.split(/\s+/),
		extra: normalizar(`${entry.keywords} ${entry.hint}`)
	};
});

export function buscarComandos(consulta: string): CommandEntry[] {
	const tokens = normalizar(consulta).split(/\s+/).filter(Boolean);

	const puntuados = INDICE.map((item) => {
		let puntaje = 0;
		for (const token of tokens) {
			if (item.palabras.some((palabra) => palabra.startsWith(token))) puntaje += 3;
			else if (item.label.includes(token)) puntaje += 2;
			else if (item.extra.includes(token)) puntaje += 1;
			else return { item, puntaje: -1 };
		}
		return { item, puntaje };
	}).filter((r) => r.puntaje >= 0);

	puntuados.sort((a, b) => {
		const grupo =
			ORDEN_GRUPOS.indexOf(a.item.entry.group) - ORDEN_GRUPOS.indexOf(b.item.entry.group);
		if (grupo !== 0) return grupo;
		if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
		return a.item.posicion - b.item.posicion;
	});

	return puntuados.map((r) => r.item.entry);
}
