export type UserStatus = "Activo" | "Inactivo";

export type UserRole = "Administrador" | "Supervisor" | "Cajero" | "Bodega";

export type User = {
	id: string;
	fotoUrl?: string;
	nombre: string;
	usuario: string;
	correo: string;
	rol: UserRole;
	estado: UserStatus;
	ultimoAcceso?: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateUserInput = {
	fotoUrl?: string;
	nombre: string;
	usuario: string;
	correo: string;
	rol: UserRole;
	estado: UserStatus;
};

export type UpdateUserInput = Partial<Omit<User, "id" | "createdAt" | "updatedAt">>;

const STORAGE_KEY = "contabilidad-pymes:users";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeUserRole(value: unknown): UserRole {
	if (value === "Administrador" || value === "Supervisor" || value === "Cajero" || value === "Bodega") return value;
	return "Cajero";
}

function normalizeUser(input: unknown): User | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const nombre = typeof input.nombre === "string" ? input.nombre : "";
	const usuario = typeof input.usuario === "string" ? input.usuario : "";
	const correo = typeof input.correo === "string" ? input.correo : "";
	const rol = normalizeUserRole(input.rol);
	const estado = input.estado === "Inactivo" ? "Inactivo" : "Activo";

	const fotoUrl = typeof input.fotoUrl === "string" && input.fotoUrl.trim() ? input.fotoUrl : undefined;
	const ultimoAcceso = typeof input.ultimoAcceso === "string" && input.ultimoAcceso.trim() ? input.ultimoAcceso : undefined;

	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, fotoUrl, nombre, usuario, correo, rol, estado, ultimoAcceso, createdAt, updatedAt };
}

function readUsers(): User[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeUser).filter((u): u is User => Boolean(u));
	} catch {
		return [];
	}
}

function writeUsers(users: User[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
	return readUsers();
}

export function addUser(input: CreateUserInput): User {
	const users = readUsers();
	const now = new Date().toISOString();

	const user: User = {
		id: generateId(),
		fotoUrl: input.fotoUrl?.trim() ? input.fotoUrl.trim() : undefined,
		nombre: input.nombre,
		usuario: input.usuario,
		correo: input.correo,
		rol: input.rol,
		estado: input.estado,
		ultimoAcceso: undefined,
		createdAt: now,
		updatedAt: now
	};

	const next = [...users, user];
	writeUsers(next);
	return user;
}

export function updateUser(id: string, update: UpdateUserInput): User | null {
	const users = readUsers();
	const index = users.findIndex((u) => u.id === id);
	if (index === -1) return null;

	const now = new Date().toISOString();
	const current = users[index];

	const nextUser: User = {
		...current,
		...update,
		fotoUrl: update.fotoUrl?.trim() ? update.fotoUrl.trim() : update.fotoUrl === "" ? undefined : current.fotoUrl,
		ultimoAcceso: update.ultimoAcceso?.trim()
			? update.ultimoAcceso.trim()
			: update.ultimoAcceso === ""
				? undefined
				: current.ultimoAcceso,
		updatedAt: now
	};

	const next = [...users];
	next[index] = nextUser;
	writeUsers(next);
	return nextUser;
}

