import { useEffect, useRef, useState } from "react";
import { NotebookPen, PackageSearch, Wallet } from "lucide-react";
import "./soluciones.css";

const SOLUCIONES = [
  {
    icono: NotebookPen,
    antes: "Antes: cuadernos y hojas de Excel",
    titulo: "Todo en un solo sistema",
    desc: "Registras la venta una vez y ya queda guardada: sin cuadernos, sin hojas sueltas, sin pasar datos de un lado a otro.",
  },
  {
    icono: PackageSearch,
    antes: "Antes: inventario que no cuadra",
    titulo: "Tu inventario, siempre exacto",
    desc: "Cada venta y cada compra actualizan el stock solas. Sabes en todo momento qué tienes y qué se está por acabar.",
  },
  {
    icono: Wallet,
    antes: "Antes: cierres de caja con diferencias",
    titulo: "Caja que cuadra sola",
    desc: "Cada movimiento queda registrado al momento. Al cerrar el día, el saldo ya está calculado y no hay que adivinar.",
  },
];

export default function Soluciones() {
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
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="soluciones"
      ref={seccionRef}
      className={`lp-soluciones${visible ? " lp-soluciones--visible" : ""}`}
      aria-labelledby="lp-soluciones-title"
    >
      <div className="lp-wrap">
        <div className="lp-soluciones__intro">
          <span className="lp-soluciones__eyebrow">Esto es lo que resolvemos</span>
          <h2 id="lp-soluciones-title" className="lp-soluciones__title">
            Menos papeleo, más control
          </h2>
          <p className="lp-soluciones__lead">
            Los problemas más comunes de un negocio pequeño tienen una misma
            causa: la información vive regada. PYMES ERP la junta en un solo
            lugar.
          </p>
        </div>

        <div className="lp-soluciones__grid">
          {SOLUCIONES.map((s, i) => {
            const Icono = s.icono;
            return (
              <div
                key={s.titulo}
                className="lp-solucion"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <span className="lp-solucion__icono">
                  <Icono size={22} strokeWidth={1.6} />
                </span>
                <p className="lp-solucion__antes">{s.antes}</p>
                <h3 className="lp-solucion__titulo">{s.titulo}</h3>
                <p className="lp-solucion__desc">{s.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="lp-soluciones__dato">
          <span className="lp-soluciones__dato-cifra">+71 mil</span>
          <p className="lp-soluciones__dato-texto">
            unidades económicas identificadas en Cartagena, gran parte de
            ellas operando todavía en la informalidad.
            <span className="lp-soluciones__dato-fuente">
              Fuente: censo empresarial, Cámara de Comercio de Cartagena
              (corte mayo de 2026).
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
