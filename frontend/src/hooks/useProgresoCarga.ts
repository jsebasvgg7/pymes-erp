import { useCallback, useRef, useState } from "react";

export interface ProgresoCarga {
  hechas: number;
  total: number;
}

export function useProgresoCarga(total: number) {
  const [hechas, setHechas] = useState(0);
  const ronda = useRef(0);

  const reiniciar = useCallback(() => {
    ronda.current += 1;
    setHechas(0);
  }, []);

  const registrar = useCallback(<T>(promesa: Promise<T>): Promise<T> => {
    const rondaActual = ronda.current;
    const sumar = () => {
      if (ronda.current === rondaActual) setHechas((n) => n + 1);
    };
    promesa.then(sumar, sumar);
    return promesa;
  }, []);

  const progreso: ProgresoCarga = { hechas: Math.min(hechas, total), total };

  return { progreso, registrar, reiniciar };
}
