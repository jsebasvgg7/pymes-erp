import { formatCurrency } from "./formatoConfig";

export function parseMonto(value: string): number | null {
	const limpio = value.replace(/[^\d.,]/g, "");
	if (!limpio) return null;
	let normalizado = limpio;
	if (limpio.includes(",")) {
		normalizado = limpio.replace(/\./g, "").replace(",", ".");
	} else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
		normalizado = limpio.replace(/\./g, "");
	}
	const n = Number(normalizado);
	return Number.isFinite(n) ? n : null;
}

export function formatoMoneda(value: number | null | undefined): string {
	return formatCurrency(value ?? 0);
}

export function esConflicto(err: unknown): boolean {
	return Boolean(err && typeof err === "object" && "response" in err && (err as { response?: { status?: number } }).response?.status === 409);
}

export function mensajeDeError(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const data = (err as { response?: { data?: { message?: string } } }).response?.data;
		if (data?.message) return data.message;
	}
	return fallback;
}
