export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia";

export type SaleItem = {
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
};

export type Sale = {
	id: string;
	number: number;
	date: string;
	paymentMethod: PaymentMethod;
	items: SaleItem[];
	subtotal: number;
	total: number;
	createdAt: string;
	updatedAt: string;
};

export type CreateSaleInput = {
	paymentMethod: PaymentMethod;
	items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
};

const STORAGE_KEY = "contabilidad-pymes:sales";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeSaleItem(input: unknown): SaleItem | null {
	if (!isRecord(input)) return null;
	if (typeof input.productId !== "string") return null;

	const productName = typeof input.productName === "string" ? input.productName : "";
	const quantity = typeof input.quantity === "number" ? input.quantity : 0;
	const unitPrice = typeof input.unitPrice === "number" ? input.unitPrice : 0;
	const subtotal = typeof input.subtotal === "number" ? input.subtotal : quantity * unitPrice;

	return { productId: input.productId, productName, quantity, unitPrice, subtotal };
}

function normalizeSale(input: unknown): Sale | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const number = typeof input.number === "number" ? input.number : 0;
	const date = typeof input.date === "string" ? input.date : "";
	const paymentMethod: PaymentMethod =
		input.paymentMethod === "Tarjeta" || input.paymentMethod === "Transferencia" ? input.paymentMethod : "Efectivo";

	const items = Array.isArray(input.items) ? input.items.map(normalizeSaleItem).filter((i): i is SaleItem => Boolean(i)) : [];
	const subtotal = typeof input.subtotal === "number" ? input.subtotal : 0;
	const total = typeof input.total === "number" ? input.total : subtotal;
	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, number, date, paymentMethod, items, subtotal, total, createdAt, updatedAt };
}

function readSales(): Sale[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeSale).filter((s): s is Sale => Boolean(s));
	} catch {
		return [];
	}
}

function writeSales(sales: Sale[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

export function getSales(): Sale[] {
	return readSales();
}

export function addSale(input: CreateSaleInput): Sale {
	const sales = readSales();
	const now = new Date().toISOString();
	const nextNumber = sales.reduce((acc, s) => Math.max(acc, s.number), 0) + 1;

	const items: SaleItem[] = input.items.map((i) => ({
		productId: i.productId,
		productName: i.productName,
		quantity: i.quantity,
		unitPrice: i.unitPrice,
		subtotal: i.quantity * i.unitPrice
	}));

	const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
	const total = subtotal;

	const sale: Sale = {
		id: generateId(),
		number: nextNumber,
		date: now,
		paymentMethod: input.paymentMethod,
		items,
		subtotal,
		total,
		createdAt: now,
		updatedAt: now
	};

	const next = [...sales, sale];
	writeSales(next);
	return sale;
}

