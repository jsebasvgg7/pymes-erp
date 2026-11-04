import { useLayoutEffect, useState, type ReactNode } from "react";
import { useFraseRotativa } from "../hooks/useFraseRotativa";
import type { ProgresoCarga } from "../hooks/useProgresoCarga";
import { frasesDe, type ClaveCarga } from "../utils/frasesCarga";
import { esperaPrevia, liberarEspera, registrarEspera } from "../utils/esperaCarga";
import { esqueletoDe } from "./skeleton/esqueletosPantalla";
import "./CargaPagina.css";

interface CargaPaginaProps {
  pagina: ClaveCarga;
  children?: ReactNode;
  progreso?: ProgresoCarga;
}

const PAGINAS_CON_PROGRESO: readonly ClaveCarga[] = ["dashboard", "pronosticos"];

export default function CargaPagina({ pagina, children, progreso }: CargaPaginaProps) {
  const [previa] = useState(() => esperaPrevia(pagina));
  const continua = previa !== null;
  const frase = useFraseRotativa(frasesDe(pagina), previa ?? 0);
  const [fraseInicial] = useState(frase);

  useLayoutEffect(() => {
    registrarEspera(pagina, continua);
    return liberarEspera;
  }, [pagina, continua]);

  const quieta = continua && frase === fraseInicial;
  const conProgreso = progreso !== undefined && progreso.total > 0;
  const reservaProgreso = conProgreso || PAGINAS_CON_PROGRESO.includes(pagina);
  const porcentaje = conProgreso ? Math.round((progreso.hechas / progreso.total) * 100) : 0;

  return (
    <div className={continua ? "cargaPagina cargaPagina--continua" : "cargaPagina"}>
      <div className="cargaPagina__encabezado">
        <p className="cargaPagina__frase" role="status" aria-live="polite">
          <span key={frase} className={quieta ? "cargaPagina__texto cargaPagina__texto--quieto" : "cargaPagina__texto"}>
            {frase}
          </span>
        </p>
        {reservaProgreso && (
          <p className="cargaPagina__progreso">
            {conProgreso ? `Cargando datos del negocio: ${porcentaje}\u00a0%` : null}
          </p>
        )}
      </div>
      <div className="cargaPagina__cuerpo" aria-hidden="true">
        {children ?? esqueletoDe(pagina)}
      </div>
    </div>
  );
}
