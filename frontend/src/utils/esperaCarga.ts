const VENTANA_CONTINUA_MS = 150;

let claveActual: string | null = null;
let inicio = 0;
let montados = 0;
let liberadaEn = 0;

function ahora(): number {
  return performance.now();
}

export function esperaPrevia(clave: string): number | null {
  if (claveActual !== clave) return null;
  if (montados === 0 && ahora() - liberadaEn > VENTANA_CONTINUA_MS) return null;
  return ahora() - inicio;
}

export function registrarEspera(clave: string, continua: boolean): void {
  if (continua && claveActual === clave) {
    montados += 1;
    return;
  }
  claveActual = clave;
  inicio = ahora();
  montados = 1;
}

export function liberarEspera(): void {
  montados = Math.max(0, montados - 1);
  liberadaEn = ahora();
}
