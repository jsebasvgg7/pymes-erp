import { useFraseRotativa } from "../hooks/useFraseRotativa";
import { frasesDe, type ClaveCarga } from "../utils/frasesCarga";
import "./LoadingState.css";

interface LoadingStateProps {
  label: string;
  pagina?: ClaveCarga;
}

export default function LoadingState({ label, pagina }: LoadingStateProps) {
  const frase = useFraseRotativa(pagina ? frasesDe(pagina) : undefined);
  const texto = frase ?? label;

  return (
    <div className="loadingState">
      <div className="loadingState__dots" aria-hidden="true">
        <span className="loadingState__dot" />
        <span className="loadingState__dot" />
        <span className="loadingState__dot" />
      </div>
      <p className="loadingState__label" role="status" aria-live="polite">
        <span key={texto} className="loadingState__text">
          {texto}
        </span>
      </p>
    </div>
  );
}
