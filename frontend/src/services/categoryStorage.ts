export type CategoryStatus = "Activo" | "Inactivo";

export type Category = {
	id: string;
	nombre: string;
	descripcion?: string;
	estado: CategoryStatus;
	createdAt: string;
	updatedAt: string;
};

export type CreateCategoryInput = {
	nombre: string;
	descripcion?: string;
	estado: CategoryStatus;
};

export type UpdateCategoryInput = Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>;

const STORAGE_KEY = "contabilidad-pymes:categories";        

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeCategory(input: unknown): Category | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const nombre = typeof input.nombre === "string" ? input.nombre : "";
	const descripcion =
		typeof input.descripcion === "string" && input.descripcion.trim() ? input.descripcion : undefined;
	const estado = input.estado === "Inactivo" ? "Inactivo" : "Activo";

	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, nombre, descripcion, estado, createdAt, updatedAt };
}

function readCategories(): Category[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeCategory).filter((c): c is Category => Boolean(c));
	} catch {
		return [];
	}
}

function writeCategories(categories: Category[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function getCategories(): Category[] {
	return readCategories();
}

export function addCategory(input: CreateCategoryInput): Category {
	const categories = readCategories();
	const now = new Date().toISOString();

	const category: Category = {
		id: generateId(),
		nombre: input.nombre,
		descripcion: input.descripcion?.trim() ? input.descripcion.trim() : undefined,
		estado: input.estado,
		createdAt: now,
		updatedAt: now
	};

	const next = [...categories, category];
	writeCategories(next);
	return category;
}

export function updateCategory(id: string, update: UpdateCategoryInput): Category | null {
	const categories = readCategories();
	const index = categories.findIndex((c) => c.id === id);
	if (index === -1) return null;

	const now = new Date().toISOString();
	const current = categories[index];

	const nextCategory: Category = {
		...current,
		...update,
		descripcion: update.descripcion?.trim()
			? update.descripcion.trim()
			: update.descripcion === ""
				? undefined
				: current.descripcion,
		updatedAt: now
	};

	const next = [...categories];
	next[index] = nextCategory;
	writeCategories(next);
	return nextCategory;
}
