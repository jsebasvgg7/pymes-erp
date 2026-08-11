export type ReceiptWidth = "58mm" | "80mm";

export type Settings = {
	company: {
		name: string;
		nit: string;
		address: string;
		city: string;
		phone: string;
		email: string;
		logoUrl: string;
	};
	system: {
		barcodeEnabled: boolean;
		currency: string;
		symbol: string;
		defaultMinStock: number;
	};
	printing: {
		receiptWidth: ReceiptWidth;
		receiptBusinessName: string;
		receiptFooterMessage: string;
	};
	additional: {
		internalNotes: string;
	};
};

const STORAGE_KEY = "contabilidad-pymes:settings";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeSettings(input: unknown): Settings | null {
	if (!isRecord(input)) return null;

	const companyRaw = isRecord(input.company) ? input.company : {};
	const systemRaw = isRecord(input.system) ? input.system : {};
	const printingRaw = isRecord(input.printing) ? input.printing : {};
	const additionalRaw = isRecord(input.additional) ? input.additional : {};

	const receiptWidth: ReceiptWidth = printingRaw.receiptWidth === "80mm" ? "80mm" : "58mm";
	const defaultMinStock = typeof systemRaw.defaultMinStock === "number" ? systemRaw.defaultMinStock : 5;

	return {
		company: {
			name: typeof companyRaw.name === "string" ? companyRaw.name : "",
			nit: typeof companyRaw.nit === "string" ? companyRaw.nit : "",
			address: typeof companyRaw.address === "string" ? companyRaw.address : "",
			city: typeof companyRaw.city === "string" ? companyRaw.city : "",
			phone: typeof companyRaw.phone === "string" ? companyRaw.phone : "",
			email: typeof companyRaw.email === "string" ? companyRaw.email : "",
			logoUrl: typeof companyRaw.logoUrl === "string" ? companyRaw.logoUrl : ""
		},
		system: {
			barcodeEnabled: typeof systemRaw.barcodeEnabled === "boolean" ? systemRaw.barcodeEnabled : false,
			currency: typeof systemRaw.currency === "string" ? systemRaw.currency : "COP",
			symbol: typeof systemRaw.symbol === "string" ? systemRaw.symbol : "$",
			defaultMinStock
		},
		printing: {
			receiptWidth,
			receiptBusinessName: typeof printingRaw.receiptBusinessName === "string" ? printingRaw.receiptBusinessName : "",
			receiptFooterMessage: typeof printingRaw.receiptFooterMessage === "string" ? printingRaw.receiptFooterMessage : ""
		},
		additional: {
			internalNotes: typeof additionalRaw.internalNotes === "string" ? additionalRaw.internalNotes : ""
		}
	};
}

export function getSettings(): Settings | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		return normalizeSettings(parsed);
	} catch {
		return null;
	}
}

export function saveSettings(settings: Settings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
