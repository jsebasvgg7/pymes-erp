import { useEffect, useRef, useState } from "react";
import "./tecnologia.css";

const STACK = [
  {
    slug: "openjdk",
    nombre: "Java",
    desc: "El lenguaje detrás de toda la lógica de negocio: ventas, inventario, caja y reportes.",
  },
  {
    slug: "springboot",
    nombre: "Spring Boot",
    desc: "Levanta la API REST, la seguridad con JWT y la conexión con la base de datos.",
  },
  {
    slug: "react",
    nombre: "React",
    desc: "Construye cada pantalla de la aplicación: rápida, modular y fácil de mantener.",
  },
  {
    slug: "typescript",
    nombre: "TypeScript",
    desc: "Añade tipado estricto al frontend para detectar errores antes de que lleguen a producción.",
  },
];

export default function Tecnologia() {
  const seccionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = seccionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="tecnologia"
      ref={seccionRef}
      className={`lp-tecnologia${visible ? " lp-tecnologia--visible" : ""}`}
      aria-labelledby="lp-tecnologia-title"
    >
      <div className="lp-wrap lp-tecnologia__grid">
        <div className="lp-tecnologia__copy">
          <span className="lp-tecnologia__eyebrow">Tecnología</span>
          <h2 id="lp-tecnologia-title" className="lp-tecnologia__title">
            Construido con herramientas que ya probaron su solidez
          </h2>
          <p className="lp-tecnologia__lead">
            No es un experimento. Pymes ERP corre sobre un stack usado hoy en
            miles de sistemas productivos, pensado para crecer contigo sin
            reescrituras.
          </p>

          <div className="lp-tecnologia__actions">
            <a
              href="https://github.com/jsebasvgg7/pymes-erp"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn lp-btn--primary"
            >
              Ver repositorio
            </a>
            <a
              href="#contacto"
              className="lp-btn lp-btn--ghost"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#contacto")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Contactar
            </a>
          </div>
        </div>

        <ul className="lp-tecnologia__lista" aria-label="Tecnologías principales del proyecto">
          {STACK.map((t, i) => (
            <li
              key={t.slug}
              className="lp-tecnologia__item"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <span className="lp-tecnologia__icono" aria-hidden="true">
                <span
                  className="lp-tecnologia__icono-svg"
                  style={{
                    WebkitMaskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${t.slug}.svg)`,
                    maskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${t.slug}.svg)`,
                  }}
                />
              </span>
              <div className="lp-tecnologia__texto">
                <p className="lp-tecnologia__nombre">{t.nombre}</p>
                <p className="lp-tecnologia__desc">{t.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
