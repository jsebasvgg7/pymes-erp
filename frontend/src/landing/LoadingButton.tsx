import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type LoadingButtonProps = {
  to?: string;
  scrollTo?: string;
  duracionMs?: number;
  className?: string;
  children: React.ReactNode;
};

export default function LoadingButton({
  to,
  scrollTo,
  duracionMs = 1800,
  className = "",
  children,
}: LoadingButtonProps) {
  const [cargando, setCargando] = useState(false);
  const bloqueado = useRef(false);
  const navigate = useNavigate();

  const alHacerClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (bloqueado.current) return;
    bloqueado.current = true;
    setCargando(true);

    setTimeout(() => {
      setCargando(false);
      bloqueado.current = false;
      if (to) {
        navigate(to);
      } else if (scrollTo) {
        document.querySelector(scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }
    }, duracionMs);
  };

  return (
    <a
      href={to ?? scrollTo ?? "#"}
      onClick={alHacerClick}
      aria-busy={cargando}
      className={`lp-btn lp-loading-btn ${className}${
        cargando ? " lp-loading-btn--cargando" : ""
      }`}
    >
      <span className="lp-loading-btn__texto">{children}</span>
      <span className="lp-loading-btn__dots" aria-hidden="true">
        <span className="lp-loading-btn__dot" />
        <span className="lp-loading-btn__dot" />
        <span className="lp-loading-btn__dot" />
      </span>
    </a>
  );
}