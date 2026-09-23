import { Phone, MessageCircle } from "lucide-react";
import logo from "../assets/logo-black.png";
import "./footer.css";

const TELEFONO = "3181261899";
const TELEFONO_INTL = "573181261899";

const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [
      { label: "Soluciones", href: "#soluciones" },
      { label: "Módulos", href: "#modulos" },
      { label: "Beneficios", href: "#beneficios" },
      { label: "Tecnología", href: "#tecnologia" },
    ],
  },
  {
    titulo: "Proyecto",
    enlaces: [
      { label: "Ver repositorio", href: "https://github.com/jsebasvgg7/pymes-erp", externo: true },
      {
        label: "Fundación Universitaria Tecnológico Comfenalco",
        href: "https://www.tecnologicocomfenalco.edu.co/",
        externo: true,
      },
    ],
  },
  {
    titulo: "Contacto",
    enlaces: [
      { label: "Solicitud", href: "#contacto" },
      { label: "correo electrónico", href: "mailto:pymeserp.oficial@gmail.com" },
    ],
  },
];

export default function Footer() {
  const anioActual = new Date().getFullYear();

  const irASeccion = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__inner">
        <div className="lp-footer__top">
          <div className="lp-footer__brand">
            <a href="#" className="lp-footer__logo" aria-label="Pymes ERP, inicio">
              <img src={logo} alt="" width={30} height={30} />
              <span>Pymes ERP</span>
            </a>
            <a href="mailto:pymeserp.oficial@gmail.com" className="lp-footer__email">
              pymeserp.oficial@gmail.com
            </a>
          </div>

          <nav className="lp-footer__cols" aria-label="Enlaces del pie de página">
            {COLUMNAS.map((col) => (
              <div key={col.titulo} className="lp-footer__col">
                <span className="lp-footer__col-title">{col.titulo}</span>
                <ul>
                  {col.enlaces.map((enlace) => (
                    <li key={enlace.label}>
                      <a
                        href={enlace.href}
                        onClick={(e) => irASeccion(e, enlace.href)}
                        {...("externo" in enlace && enlace.externo
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {enlace.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="lp-footer__bottom">
          <p className="lp-footer__copy">
            © {anioActual} Pymes ERP. Proyecto académico y comercial.
          </p>

          <div className="lp-footer__socials" aria-label="Contacto directo">
            <a
              href={`tel:+${TELEFONO_INTL}`}
              className="lp-footer__icon"
              aria-label={`Llamar al ${TELEFONO}`}
              title={TELEFONO}
            >
              <Phone size={17} strokeWidth={1.75} />
            </a>
            <a
              href={`sms:+${TELEFONO_INTL}`}
              className="lp-footer__icon"
              aria-label={`Enviar SMS al ${TELEFONO}`}
              title={TELEFONO}
            >
              <MessageCircle size={17} strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
