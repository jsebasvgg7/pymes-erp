type RolConModulos = { nombre: string; modulos?: string[] };
type UsuarioConRoles = { roles?: RolConModulos[] } | null | undefined;

const RUTAS_POR_MODULO: Array<[string, string]> = [
	["DASHBOARD", "/dashboard"],
	["POS", "/pos"],
	["CAJA", "/caja"],
	["INVENTARIO", "/inventario"],
	["COMPRAS", "/compras"],
	["PRODUCTOS", "/productos"],
	["CATEGORIAS", "/categorias"],
	["CLIENTES", "/clientes"],
	["PROVEEDORES", "/proveedores"],
	["REPORTES", "/reportes"],
	["USUARIOS", "/usuarios"],
	["ROLES", "/roles"],
	["CONFIGURACION", "/configuracion"]
];

export function esAdmin(usuario: UsuarioConRoles): boolean {
	return Boolean(usuario?.roles?.some((r) => r.nombre === "ADMIN"));
}

export function tieneModulo(usuario: UsuarioConRoles, modulo?: string): boolean {
	if (!modulo) return true;
	if (esAdmin(usuario)) return true;
	return Boolean(usuario?.roles?.some((r) => r.modulos?.includes(modulo)));
}

export function primeraRutaPermitida(usuario: UsuarioConRoles): string | null {
	const destino = RUTAS_POR_MODULO.find(([modulo]) => tieneModulo(usuario, modulo));
	return destino ? destino[1] : null;
}
