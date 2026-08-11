export type CashMovementType = "Ingreso" | "Egreso";

export type CashMovement = {
	id: string;
	fecha: string;
	tipo: CashMovementType;
	concepto: string;
	valor: number;
	observacion?: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateCashMovementInput = {
	tipo: CashMovementType;
	concepto: string;
	valor: number;
	observacion?: string;
};

const STORAGE_KEY = "contabilidad-pymes:cash-movements";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeMovement(input: unknown): CashMovement | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const fecha = typeof input.fecha === "string" ? input.fecha : new Date(0).toISOString();
	const tipo: CashMovementType = input.tipo === "Egreso" ? "Egreso" : "Ingreso";
	const concepto = typeof input.concepto === "string" ? input.concepto : "";
	const valor = typeof input.valor === "number" ? input.valor : 0;
	const observacion =
		typeof input.observacion === "string" && input.observacion.trim() ? input.observacion : undefined;

	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, fecha, tipo, concepto, valor, observacion, createdAt, updatedAt };
}

function readMovements(): CashMovement[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeMovement).filter((m): m is CashMovement => Boolean(m));
	} catch {
		return [];
	}
}

function writeMovements(movements: CashMovement[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

export function getCashMovements(): CashMovement[] {
	return readMovements();
}

export function addCashMovement(input: CreateCashMovementInput): CashMovement {
	const movements = readMovements();
	const now = new Date().toISOString();

	const movement: CashMovement = {
		id: generateId(),
		fecha: now,
		tipo: input.tipo,
		concepto: input.concepto,
		valor: input.valor,
		observacion: input.observacion?.trim() ? input.observacion.trim() : undefined,
		createdAt: now,
		updatedAt: now
	};

	const next = [...movements, movement];
	writeMovements(next);
	return movement;
}

