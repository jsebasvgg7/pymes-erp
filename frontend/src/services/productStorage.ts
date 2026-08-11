export type ProductStatus = "Activo" | "Inactivo";

export type Product = {
	id: string;
	nombre: string;
	categoria: string;
	precioCompra: number;
	precioVenta: number;
	stock: number;
	estado: ProductStatus;
	imagen?: string;
	descripcion?: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateProductInput = {
	nombre: string;
	categoria: string;
	precioCompra: number;
	precioVenta: number;
	stock: number;
	estado: ProductStatus;
	imagen?: string;
	descripcion?: string;
};

export type UpdateProductInput = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>;

const STORAGE_KEY = "contabilidad-pymes:products";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeProduct(input: unknown): Product | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const nombre = typeof input.nombre === "string" ? input.nombre : "";
	const categoria = typeof input.categoria === "string" ? input.categoria : "";
	const precioCompra = typeof input.precioCompra === "number" ? input.precioCompra : 0;
	const precioVenta = typeof input.precioVenta === "number" ? input.precioVenta : 0;
	const stock = typeof input.stock === "number" ? input.stock : 0;
	const estado = input.estado === "Inactivo" ? "Inactivo" : "Activo";

	const imagen = typeof input.imagen === "string" && input.imagen.trim() ? input.imagen : undefined;
	const descripcion =
		typeof input.descripcion === "string" && input.descripcion.trim() ? input.descripcion : undefined;

	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return {
		id: input.id,
		nombre,
		categoria,
		precioCompra,
		precioVenta,
		stock,
		estado,
		imagen,
		descripcion,
		createdAt,
		updatedAt
	};
}

function readProducts(): Product[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeProduct).filter((p): p is Product => Boolean(p));
	} catch {
		return [];
	}
}

function writeProducts(products: Product[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function getProducts(): Product[] {
	return readProducts();
}

export function saveProducts(products: Product[]) {
	writeProducts(products);
}

export function addProduct(input: CreateProductInput): Product {
	const products = readProducts();
	const now = new Date().toISOString();

	const product: Product = {
		id: generateId(),
		nombre: input.nombre,
		categoria: input.categoria,
		precioCompra: input.precioCompra,
		precioVenta: input.precioVenta,
		stock: input.stock,
		estado: input.estado,
		imagen: input.imagen?.trim() ? input.imagen.trim() : undefined,
		descripcion: input.descripcion?.trim() ? input.descripcion.trim() : undefined,
		createdAt: now,
		updatedAt: now
	};

	const next = [...products, product];
	writeProducts(next);
	return product;
}

export function updateProduct(id: string, update: UpdateProductInput): Product | null {
	const products = readProducts();
	const index = products.findIndex((p) => p.id === id);
	if (index === -1) return null;

	const now = new Date().toISOString();
	const current = products[index];

	const nextProduct: Product = {
		...current,
		...update,
		imagen: update.imagen?.trim() ? update.imagen.trim() : update.imagen === "" ? undefined : current.imagen,
		descripcion: update.descripcion?.trim()
			? update.descripcion.trim()
			: update.descripcion === ""
				? undefined
				: current.descripcion,
		updatedAt: now
	};

	const next = [...products];
	next[index] = nextProduct;
	writeProducts(next);
	return nextProduct;
}

export function deleteProduct(id: string): boolean {
	const products = readProducts();
	const next = products.filter((p) => p.id !== id);
	if (next.length === products.length) return false;
	writeProducts(next);
	return true;
}
