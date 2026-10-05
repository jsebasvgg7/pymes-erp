type CsvValue = string | number | null | undefined;

function escapeCsvValue(value: CsvValue): string {
	const text = String(value ?? "");
	const safeText = typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
	return `"${safeText.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
	const content = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(";")).join("\r\n");
	const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
