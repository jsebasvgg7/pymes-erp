import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { authService } from "../services/authService";

const SECCIONES = [
  { href: "#modulos", label: "Módulos" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#equipo", label: "Equipo" },
];

export default function LandingNav() {
  const conSesion = authService.isAuthenticated();

  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav__inner">
        <Link to="/" className="lp-brand" aria-label="PYMES ERP, inicio">
          <img src={logo} alt="" width={34} height={34} />
          <span>PYMES ERP</span>
        </Link>

        <nav className="lp-nav__links" aria-label="Secciones de la página">
          {SECCIONES.map((s) => (
            <a key={s.href} href={s.href}>
              {s.label}
            </a>
          ))}
        </nav>

        <Link
          to={conSesion ? "/dashboard" : "/login"}
          className="lp-btn lp-btn--primary lp-btn--sm"
        >
          {conSesion ? "Ir al panel" : "Iniciar sesión"}
        </Link>
      </div>
    </header>
  );
}
