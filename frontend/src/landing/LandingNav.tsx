import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";
import LoadingButton from "./LoadingButton";
import "./loading-button.css";

const SECCIONES = [
  { href: "#soluciones", label: "Soluciones" },
  { href: "#modulos", label: "Módulos" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#tecnologia", label: "Tecnología" },
  { href: "#contacto", label: "Contacto" },
];

// Mapa de compensaciones según el ID de la sección
const OFFSETS_SECCION: Record<string, number> = {
  "#beneficios": 145,
  "#tecnologia": 125,
  "#contacto": 100,
};

export default function LandingNav() {
  const conSesion = authService.isAuthenticated();
  const [conScroll, setConScroll] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const alScroll = () => setConScroll(window.scrollY > 8);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  const irASeccion = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate(`/${href}`);
      return;
    }

    const destino = document.querySelector(href);
    if (!destino) return;

    const compensacion = OFFSETS_SECCION[href] || 0;
    const top = destino.getBoundingClientRect().top + window.scrollY - 120 + compensacion;

    window.scrollTo({ top, behavior: "smooth" });
  };

  const irAInicio = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className={`lp-nav${conScroll ? " lp-nav--scrolled" : ""}`}>
      <div className="lp-wrap lp-nav__inner">
        <Link
          to="/"
          className="lp-brand"
          aria-label="Pymes ERP, inicio"
          onClick={irAInicio}
        >
          <img src={logo} alt="" width={34} height={34} />
          <span>Pymes ERP</span>
        </Link>

        <nav className="lp-nav__links" aria-label="Secciones de la página">
          {SECCIONES.map((s) => (
            <a key={s.href} href={s.href} onClick={(e) => irASeccion(e, s.href)}>
              {s.label}
            </a>
          ))}
        </nav>

        <LoadingButton
          to={conSesion ? "/dashboard" : "/login"}
          className="lp-btn--primary lp-btn--sm"
          duracionMs={900}
        >
          {conSesion ? "Ir al panel" : "Login"}
        </LoadingButton>
      </div>
    </header>
  );
}