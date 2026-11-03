import { useEffect, useState } from "react";

const ESPERA_INICIAL_MS = 3000;
const INTERVALO_MS = 3000;

function indiceEn(transcurridoMs: number, cantidad: number): number {
  if (cantidad < 2 || transcurridoMs < ESPERA_INICIAL_MS) return 0;
  return (1 + Math.floor((transcurridoMs - ESPERA_INICIAL_MS) / INTERVALO_MS)) % cantidad;
}

export function useFraseRotativa(frases: readonly string[] | undefined, desfaseMs = 0): string | null {
  const cantidad = frases?.length ?? 0;
  const [indice, setIndice] = useState(() => indiceEn(desfaseMs, cantidad));

  useEffect(() => {
    if (cantidad < 2) {
      setIndice(0);
      return;
    }

    const origen = performance.now() - desfaseMs;
    let temporizador: number | undefined;

    const actualizar = () => {
      const transcurrido = performance.now() - origen;
      setIndice(indiceEn(transcurrido, cantidad));
      const faltante =
        transcurrido < ESPERA_INICIAL_MS
          ? ESPERA_INICIAL_MS - transcurrido
          : INTERVALO_MS - ((transcurrido - ESPERA_INICIAL_MS) % INTERVALO_MS);
      temporizador = window.setTimeout(actualizar, faltante);
    };

    actualizar();

    return () => {
      if (temporizador !== undefined) window.clearTimeout(temporizador);
    };
  }, [frases, cantidad, desfaseMs]);

  if (!frases || frases.length === 0) return null;
  return frases[indice % frases.length];
}
