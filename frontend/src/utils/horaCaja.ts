const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

export function msHastaHora(hora: string, ahora: number = Date.now()): number {
	const [horas, minutos] = hora.split(":").map(Number);
	const msDelDia = (((ahora + DESFASE_BOGOTA_MS) % DIA_MS) + DIA_MS) % DIA_MS;
	const objetivo = (horas * 60 + minutos) * 60 * 1000;
	const espera = objetivo - msDelDia;
	return espera <= 0 ? espera + DIA_MS : espera;
}
