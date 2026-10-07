export function formatDateShort(value: string) {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
