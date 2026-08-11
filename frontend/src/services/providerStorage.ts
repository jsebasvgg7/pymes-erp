export type ProviderStatus = "Activo" | "Inactivo";

export type Provider = {
	id: string;
	empresa: string;
	nit: string;
	contacto: string;
	telefono: string;
	correo: string;
	direccion: string;
	estado: ProviderStatus;
	createdAt: string;
	updatedAt: string;
};

export type CreateProviderInput = Omit<Provider, "id" | "createdAt" | "updatedAt">;
export type UpdateProviderInput = Partial<Omit<Provider, "id" | "createdAt" | "updatedAt">>;

const STORAGE_KEY = "contabilidad-pymes:providers";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeProvider(input: unknown): Provider | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const empresa = typeof input.empresa === "string" ? input.empresa : "";
	const nit = typeof input.nit === "string" ? input.nit : "";
	const contacto = typeof input.contacto === "string" ? input.contacto : "";
	const telefono = typeof input.telefono === "string" ? input.telefono : "";
	const correo = typeof input.correo === "string" ? input.correo : "";
	const direccion = typeof input.direccion === "string" ? input.direccion : "";
	const estado = input.estado === "Inactivo" ? "Inactivo" : "Activo";
	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, empresa, nit, contacto, telefono, correo, direccion, estado, createdAt, updatedAt };
}

function readProviders(): Provider[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeProvider).filter((p): p is Provider => Boolean(p));
	} catch {
		return [];
	}
}

function writeProviders(providers: Provider[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
}

export function getProviders(): Provider[] {
	return readProviders();
}

export function addProvider(input: CreateProviderInput): Provider {
	const providers = readProviders();
	const now = new Date().toISOString();

	const provider: Provider = {
		id: generateId(),
		empresa: input.empresa,
		nit: input.nit,
		contacto: input.contacto,
		telefono: input.telefono,
		correo: input.correo,
		direccion: input.direccion,
		estado: input.estado,
		createdAt: now,
		updatedAt: now
	};

	const next = [...providers, provider];
	writeProviders(next);
	return provider;
}

export function updateProvider(id: string, update: UpdateProviderInput): Provider | null {
	const providers = readProviders();
	const index = providers.findIndex((p) => p.id === id);
	if (index === -1) return null;

	const now = new Date().toISOString();
	const current = providers[index];

	const nextProvider: Provider = {
		...current,
		...update,
		updatedAt: now
	};

	const next = [...providers];
	next[index] = nextProvider;
	writeProviders(next);
	return nextProvider;
}
