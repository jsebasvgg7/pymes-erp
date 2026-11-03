import { useLayoutEffect, useState, type ReactNode } from "react";
import { useFraseRotativa } from "../hooks/useFraseRotativa";
import { frasesDe, type ClaveCarga } from "../utils/frasesCarga";
import { esperaPrevia, liberarEspera, registrarEspera } from "../utils/esperaCarga";
import { esqueletoDe } from "./skeleton/esqueletosPantalla";
import "./CargaPagina.css";

interface CargaPaginaProps {
  pagina: ClaveCarga;
  children?: ReactNode;
}

export default function CargaPagina({ pagina, children }: CargaPaginaProps) {
  const [previa] = useState(() => esperaPrevia(pagina));
  const continua = previa !== null;
  const frase = useFraseRotativa(frasesDe(pagina), previa ?? 0);
  const [fraseInicial] = useState(frase);

  useLayoutEffect(() => {
    registrarEspera(pagina, continua);
    return liberarEspera;
  }, [pagina, continua]);

  const quieta = continua && frase === fraseInicial;

  return (
    <div className={continua ? "cargaPagina cargaPagina--continua" : "cargaPagina"}>
      <p className="cargaPagina__frase" role="status" aria-live="polite">
        <span key={frase} className={quieta ? "cargaPagina__texto cargaPagina__texto--quieto" : "cargaPagina__texto"}>
          {frase}
        </span>
      </p>
      <div className="cargaPagina__cuerpo" aria-hidden="true">
        {children ?? esqueletoDe(pagina)}
      </div>
    </div>
  );
}
