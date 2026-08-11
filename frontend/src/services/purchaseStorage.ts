export type PurchaseItem = {
	productId: string;
	productName: string;
	quantity: number;
	purchasePrice: number;
	subtotal: number;
};

export type Purchase = {
	id: string;
	number: number;
	providerId: string;
	providerName: string;
	date: string;
	items: PurchaseItem[];
	totalQuantity: number;
	total: number;
	createdAt: string;
	updatedAt: string;
};

export type CreatePurchaseInput = {
	providerId: string;
	providerName: string;
	date: string;
	items: Array<{ productId: string; productName: string; quantity: number; purchasePrice: number }>;
};

const STORAGE_KEY = "contabilidad-pymes:purchases";

function generateId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizePurchaseItem(input: unknown): PurchaseItem | null {
	if (!isRecord(input)) return null;
	if (typeof input.productId !== "string") return null;

	const productName = typeof input.productName === "string" ? input.productName : "";
	const quantity = typeof input.quantity === "number" ? input.quantity : 0;
	const purchasePrice = typeof input.purchasePrice === "number" ? input.purchasePrice : 0;
	const subtotal = typeof input.subtotal === "number" ? input.subtotal : quantity * purchasePrice;

	return { productId: input.productId, productName, quantity, purchasePrice, subtotal };
}

function normalizePurchase(input: unknown): Purchase | null {
	if (!isRecord(input)) return null;
	if (typeof input.id !== "string") return null;

	const number = typeof input.number === "number" ? input.number : 0;
	const providerId = typeof input.providerId === "string" ? input.providerId : "";
	const providerName = typeof input.providerName === "string" ? input.providerName : "";
	const date = typeof input.date === "string" ? input.date : "";

	const items = Array.isArray(input.items)
		? input.items.map(normalizePurchaseItem).filter((i): i is PurchaseItem => Boolean(i))
		: [];

	const totalQuantity = typeof input.totalQuantity === "number" ? input.totalQuantity : 0;
	const total = typeof input.total === "number" ? input.total : 0;
	const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString();
	const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : createdAt;

	return { id: input.id, number, providerId, providerName, date, items, totalQuantity, total, createdAt, updatedAt };
}

function readPurchases(): Purchase[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizePurchase).filter((p): p is Purchase => Boolean(p));
	} catch {
		return [];
	}
}

function writePurchases(purchases: Purchase[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
}

export function getPurchases(): Purchase[] {
	return readPurchases();
}

export function addPurchase(input: CreatePurchaseInput): Purchase {
	const purchases = readPurchases();
	const now = new Date().toISOString();
	const nextNumber = purchases.reduce((acc, p) => Math.max(acc, p.number), 0) + 1;

	const items: PurchaseItem[] = input.items.map((i) => ({
		productId: i.productId,
		productName: i.productName,
		quantity: i.quantity,
		purchasePrice: i.purchasePrice,
		subtotal: i.quantity * i.purchasePrice
	}));

	const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
	const total = items.reduce((acc, i) => acc + i.subtotal, 0);

	const purchase: Purchase = {
		id: generateId(),
		number: nextNumber,
		providerId: input.providerId,
		providerName: input.providerName,
		date: input.date,
		items,
		totalQuantity,
		total,
		createdAt: now,
		updatedAt: now
	};

	const next = [...purchases, purchase];
	writePurchases(next);
	return purchase;
}

