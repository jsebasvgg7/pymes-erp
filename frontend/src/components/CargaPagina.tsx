import type { ReactNode } from "react";
import { useFraseRotativa } from "../hooks/useFraseRotativa";
import { frasesDe, type ClaveCarga } from "../utils/frasesCarga";
import "./CargaPagina.css";

interface CargaPaginaProps {
  pagina: ClaveCarga;
  children: ReactNode;
}

export default function CargaPagina({ pagina, children }: CargaPaginaProps) {
  const frase = useFraseRotativa(frasesDe(pagina));

  return (
    <div className="cargaPagina">
      <p className="cargaPagina__frase" role="status" aria-live="polite">
        <span key={frase} className="cargaPagina__texto">
          {frase}
        </span>
      </p>
      <div className="cargaPagina__cuerpo" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
