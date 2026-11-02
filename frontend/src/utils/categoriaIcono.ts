import {
	Apple,
	Beef,
	Cookie,
	Croissant,
	CupSoda,
	Gift,
	House,
	Laptop,
	Milk,
	Package,
	Pencil,
	Pill,
	Puzzle,
	Shirt,
	ShoppingBasket,
	Sparkles,
	SprayCan,
	Tag,
	Utensils,
	Wrench,
	type LucideIcon
} from "lucide-react";

export type OpcionIcono = { clave: string; etiqueta: string; icono: LucideIcon };

export const ICONOS_CATEGORIA: OpcionIcono[] = [
	{ clave: "tag", etiqueta: "General", icono: Tag },
	{ clave: "cup-soda", etiqueta: "Bebidas", icono: CupSoda },
	{ clave: "croissant", etiqueta: "Panadería", icono: Croissant },
	{ clave: "spray-can", etiqueta: "Limpieza", icono: SprayCan },
	{ clave: "pencil", etiqueta: "Papelería", icono: Pencil },
	{ clave: "wrench", etiqueta: "Ferretería", icono: Wrench },
	{ clave: "beef", etiqueta: "Carnes", icono: Beef },
	{ clave: "milk", etiqueta: "Lácteos", icono: Milk },
	{ clave: "apple", etiqueta: "Frutas y verduras", icono: Apple },
	{ clave: "cookie", etiqueta: "Snacks y dulces", icono: Cookie },
	{ clave: "shopping-basket", etiqueta: "Mercado", icono: ShoppingBasket },
	{ clave: "shirt", etiqueta: "Ropa", icono: Shirt },
	{ clave: "laptop", etiqueta: "Tecnología", icono: Laptop },
	{ clave: "house", etiqueta: "Hogar", icono: House },
	{ clave: "utensils", etiqueta: "Cocina", icono: Utensils },
	{ clave: "puzzle", etiqueta: "Juguetería", icono: Puzzle },
	{ clave: "pill", etiqueta: "Farmacia", icono: Pill },
	{ clave: "sparkles", etiqueta: "Cuidado personal", icono: Sparkles },
	{ clave: "package", etiqueta: "Empaques", icono: Package },
	{ clave: "gift", etiqueta: "Regalos", icono: Gift }
];

export const ICONO_POR_DEFECTO = "tag";

const REGLAS: Array<{ claves: string[]; icono: LucideIcon }> = [
	{ claves: ["bebida", "gaseosa", "jugo", "agua", "cerveza", "licor", "cafe"], icono: CupSoda },
	{ claves: ["pan", "panader", "pastel", "reposter", "torta"], icono: Croissant },
	{ claves: ["aseo", "limpieza", "detergente", "higiene"], icono: SprayCan },
	{ claves: ["papeler", "escolar", "oficina", "cuaderno"], icono: Pencil },
	{ claves: ["ferret", "herramienta", "tornill", "construc"], icono: Wrench },
	{ claves: ["carne", "pollo", "embutido", "pescado", "charcuter"], icono: Beef },
	{ claves: ["lacteo", "leche", "queso", "yogur"], icono: Milk },
	{ claves: ["fruta", "verdura", "hortaliza", "legumbre"], icono: Apple },
	{ claves: ["snack", "dulce", "galleta", "confiter", "golosina", "mecato"], icono: Cookie }
];

function normalizar(texto: string): string {
	return texto
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase();
}

export function iconoParaCategoria(nombre: string, clave?: string | null): LucideIcon {
	const elegido = clave ? ICONOS_CATEGORIA.find((o) => o.clave === clave) : undefined;
	if (elegido) return elegido.icono;
	const base = normalizar(nombre);
	const regla = REGLAS.find((r) => r.claves.some((c) => base.includes(c)));
	return regla ? regla.icono : Tag;
}

export function normalizarBusqueda(texto: string): string {
	return normalizar(texto);
}
