import {
	Apple,
	Beef,
	Cookie,
	Croissant,
	CupSoda,
	Milk,
	Pencil,
	SprayCan,
	Tag,
	Wrench,
	type LucideIcon
} from "lucide-react";

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

export function iconoParaCategoria(nombre: string): LucideIcon {
	const base = normalizar(nombre);
	const regla = REGLAS.find((r) => r.claves.some((c) => base.includes(c)));
	return regla ? regla.icono : Tag;
}

export function normalizarBusqueda(texto: string): string {
	return normalizar(texto);
}
