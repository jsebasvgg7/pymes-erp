import { useEffect, useRef, useState } from "react";
import { TrendingUp, ShieldCheck, LineChart } from "lucide-react";
import "./beneficios.css";

const BENEFICIOS = [
  {
    icono: TrendingUp,
    titulo: "Menos tiempo perdido",
    desc: "Las tareas que antes tomaban horas se resuelven solas mientras vendes.",
  },
  {
    icono: ShieldCheck,
    titulo: "Cero descuadres",
    desc: "El stock y la caja siempre coinciden con lo que realmente vendiste.",
  },
  {
    icono: LineChart,
    titulo: "Decisiones con datos reales",
    desc: "Sabes qué se vende, qué se agota y cuánto ganaste, sin esperar a fin de mes.",
  },
];

export default function Beneficios() {
  const seccionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const tarjetasRef = useRef<HTMLDivElement>(null);

  const [visibleIntro, setVisibleIntro] = useState(false);
  const [visibleTarjetas, setVisibleTarjetas] = useState(false);

  useEffect(() => {
    const elIntro = introRef.current;
    if (!elIntro) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleIntro(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(elIntro);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const elTarjetas = tarjetasRef.current;
    if (!elTarjetas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleTarjetas(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(elTarjetas);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="beneficios"
      ref={seccionRef}
      className="lp-beneficios-seccion"
      aria-labelledby="lp-beneficios-seccion-title"
    >
      <div className="lp-wrap">
        <div
          ref={introRef}
          className={`lp-beneficios-seccion__intro${
            visibleIntro ? " lp-beneficios-seccion__intro--visible" : ""
          }`}
        >
          <span className="lp-beneficios-seccion__eyebrow">Beneficios</span>
          <h2 id="lp-beneficios-seccion-title" className="lp-beneficios-seccion__title">
            Un negocio más rentable
            <br />
            sin cambiar cómo trabajas
          </h2>
        </div>

        <div
          ref={tarjetasRef}
          className={`lp-beneficios${
            visibleTarjetas ? " lp-beneficios--visible" : ""
          }`}
        >
          {BENEFICIOS.map((b, i) => {
            const Icono = b.icono;
            return (
              <div
                key={b.titulo}
                className="lp-beneficio"
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                <span className="lp-beneficio__icono">
                  <Icono size={26} strokeWidth={1.6} />
                </span>
                <h3 className="lp-beneficio__titulo">{b.titulo}</h3>
                <p className="lp-beneficio__desc">{b.desc}</p>

                <div className="lp-beneficio__media" aria-hidden="true">
                  {i === 0 && (
                    <>
                      <div className="lp-mock-ticket__sombra" />
                      <div className="lp-mock-ticket">
                        <div className="lp-mock-ticket__fila">
                          <span className="lp-mock-ticket__etiqueta">
                            Venta de hoy
                          </span>
                          <span className="lp-mock-ticket__badge">+18%</span>
                        </div>
                        <p className="lp-mock-ticket__cifra">$482.600</p>
                      </div>
                    </>
                  )}

                  {i === 1 && (
                    <div className="lp-mock-inventario">
                      <div className="lp-mock-inventario__cab">
                        Stock por producto
                      </div>
                      <div className="lp-mock-inventario__filas">
                        <div className="lp-mock-inventario__item">
                          <span className="lp-mock-inventario__nombre">
                            Gaseosa 1.5L
                          </span>
                          <span className="lp-mock-inventario__valor">
                            34 uds
                          </span>
                          <div className="lp-mock-inventario__barra">
                            <span style={{ width: "72%" }} />
                          </div>
                        </div>
                        <div className="lp-mock-inventario__item">
                          <span className="lp-mock-inventario__nombre">
                            Pan tajado
                          </span>
                          <span className="lp-mock-inventario__valor lp-mock-inventario__valor--bajo">
                            3 uds
                          </span>
                          <div className="lp-mock-inventario__barra lp-mock-inventario__barra--bajo">
                            <span style={{ width: "12%" }} />
                          </div>
                        </div>
                        <div className="lp-mock-inventario__item">
                          <span className="lp-mock-inventario__nombre">
                            Arroz 500g
                          </span>
                          <span className="lp-mock-inventario__valor">
                            51 uds
                          </span>
                          <div className="lp-mock-inventario__barra">
                            <span style={{ width: "88%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {i === 2 && (
                    <div className="lp-mock-reporte">
                      <div className="lp-mock-reporte__cab">
                        <span className="lp-mock-reporte__usuario">
                          <span className="lp-mock-reporte__avatar" />
                          Caja · turno tarde
                        </span>
                      </div>
                      <div className="lp-mock-reporte__linea">
                        <span
                          className="lp-mock-reporte__barra"
                          style={{ height: "40%" }}
                        />
                        <span
                          className="lp-mock-reporte__barra"
                          style={{ height: "65%" }}
                        />
                        <span
                          className="lp-mock-reporte__barra lp-mock-reporte__barra--activa"
                          style={{ height: "100%" }}
                        />
                        <span
                          className="lp-mock-reporte__barra"
                          style={{ height: "55%" }}
                        />
                        <span
                          className="lp-mock-reporte__barra"
                          style={{ height: "78%" }}
                        />
                      </div>
                      <div className="lp-mock-reporte__pie">
                        <span className="lp-mock-reporte__pie-etq">
                          Ganancia del día
                        </span>
                        <span className="lp-mock-reporte__pie-val">
                          $137.900
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}