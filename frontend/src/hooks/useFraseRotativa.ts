import { useEffect, useState } from "react";

const ESPERA_INICIAL_MS = 3000;
const INTERVALO_MS = 3000;

export function useFraseRotativa(frases: readonly string[] | undefined): string | null {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
    const cantidad = frases?.length ?? 0;
    if (cantidad < 2) return;

    let intervalo: number | undefined;
    const inicio = window.setTimeout(() => {
      setIndice(1);
      intervalo = window.setInterval(() => {
        setIndice((actual) => (actual + 1) % cantidad);
      }, INTERVALO_MS);
    }, ESPERA_INICIAL_MS);

    return () => {
      window.clearTimeout(inicio);
      if (intervalo !== undefined) window.clearInterval(intervalo);
    };
  }, [frases]);

  if (!frases || frases.length === 0) return null;
  return frases[indice % frases.length];
}
