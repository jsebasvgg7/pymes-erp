import { useEffect, useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import "./precios.css";

type Plan = {
  titulo: string;
  desc: string;
  features: string[];
  precio: string;
  ctaLabel: string;
  destacado?: boolean;
};

const PLANES: Plan[] = [
  {
    titulo: "Plan Esencial",
    desc: "Diseñado para operar un punto de venta con un único usuario activo.",
    features: [
      "Acceso web completo (POS, Inventario, Caja, Compras y Reportes)",
      "Base de datos en la nube respaldada automáticamente",
      "Parches de seguridad y mantenimiento de estabilidad continuos",
      "Interfaz responsive optimizada para PC, tablet y teléfono móvil",
    ],
    precio: "$$$",
    ctaLabel: "Crear cuenta",
  },
  {
    titulo: "Plan Avanzado",
    desc: "Para comercios con más personal, múltiples cajeros y control de permisos.",
    features: [
      "Todo lo incluido en el Plan Esencial",
      "Múltiples usuarios y gestión de roles (Administrador, Cajero)",
      "Soporte técnico prioritario y asistencia directa",
      "Acceso continuo a nuevas funciones y actualizaciones del sistema",
    ],
    precio: "$$$",
    ctaLabel: "Mejorar cuenta",
    destacado: true,
  },
];

export default function Pricing() {
  const introRef = useRef<HTMLDivElement>(null);
  const planesRef = useRef<HTMLDivElement>(null);

  const [visibleIntro, setVisibleIntro] = useState(false);
  const [visiblePlanes, setVisiblePlanes] = useState(false);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleIntro(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = planesRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisiblePlanes(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="precios"
      className="lp-pricing"
      aria-labelledby="lp-pricing-title"
    >
      <div className="lp-wrap">
        <div
          ref={introRef}
          className={`lp-pricing__intro${
            visibleIntro ? " lp-pricing__intro--visible" : ""
          }`}
        >
          <h2 id="lp-pricing-title" className="lp-pricing__title">
            Inversión clara y simple. Tu sistema listo en la nube en minutos.
          </h2>
          <div className="lp-pricing__lead-block">
            <p className="lp-pricing__lead">
              Compra la licencia una sola vez para tu negocio. Los servicios
              de infraestructura en la nube se pagan aparte, únicamente si
              decides utilizarlos.
            </p>
            <a className="lp-pricing__cta-link" href="#contacto">
              Contáctanos <ArrowRight size={16} strokeWidth={2} />
            </a>
          </div>
        </div>

        <div
          ref={planesRef}
          className={`lp-planes${visiblePlanes ? " lp-planes--visible" : ""}`}
        >
          {PLANES.map((plan, i) => (
            <div
              key={plan.titulo}
              className={`lp-plan${
                plan.destacado ? " lp-plan--destacado" : " lp-plan--compacto"
              }`}
              style={{ transitionDelay: `${i * 110}ms` }}
            >
              {plan.destacado && <span className="lp-plan__badge">Popular</span>}

              <h3 className="lp-plan__titulo">{plan.titulo}</h3>
              <p className="lp-plan__desc">{plan.desc}</p>

              <ul className="lp-plan__features">
                {plan.features.map((f) => (
                  <li key={f} className="lp-plan__feature">
                    <Check size={18} strokeWidth={2.25} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="lp-plan__pie">
                <span className="lp-plan__precio">
                  {plan.precio} <small>/ pago único</small>
                </span>
                <button
                  type="button"
                  className={`lp-plan__cta${
                    plan.destacado ? " lp-plan__cta--lima" : " lp-plan__cta--oscuro"
                  }`}
                >
                  {plan.ctaLabel}
                  {plan.destacado && <ArrowRight size={16} strokeWidth={2.25} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}