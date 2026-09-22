import { useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  Package,
  Wallet,
  BarChart3,
  Users,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import "./modulos.css";

const ICONOS_INTRO: LucideIcon[] = [Package, ShoppingCart, Wallet];

type Nodo = {
  icono: LucideIcon;
  titulo: string;
  texto: string;
  fila: "arriba" | "abajo";
};

const NODOS: Nodo[] = [
  {
    icono: ShoppingCart,
    titulo: "Punto de venta",
    texto: "Vende rápido, sin fricción",
    fila: "arriba",
  },
  {
    icono: Package,
    titulo: "Inventario y compras",
    texto: "Sabes qué tienes y qué falta",
    fila: "arriba",
  },
  {
    icono: Wallet,
    titulo: "Caja",
    texto: "Cierra el día sin sorpresas",
    fila: "arriba",
  },
  {
    icono: BarChart3,
    titulo: "Reportes",
    texto: "Decide con datos, no con memoria",
    fila: "arriba",
  },
  {
    icono: Users,
    titulo: "Clientes y proveedores",
    texto: "Todos tus contactos en un lugar",
    fila: "abajo",
  },
  {
    icono: ShieldCheck,
    titulo: "Usuarios y roles",
    texto: "Cada quien con su acceso",
    fila: "abajo",
  },
];

export default function Modulos() {
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
      id="modulos"
      ref={seccionRef}
      className={`lp-modulos${visible ? " lp-modulos--visible" : ""}`}
      aria-labelledby="lp-modulos-title"
    >
      <div className="lp-wrap">
        <div className="lp-modulos__intro">
          <div className="lp-modulos__iconos" aria-hidden="true">
            {ICONOS_INTRO.map((Icono, i) => (
              <span key={i} className="lp-modulos__icono">
                <Icono size={36} strokeWidth={1.6} />
              </span>
            ))}
          </div>

          <h2 id="lp-modulos-title" className="lp-modulos__title">
            Un módulo alimenta al siguiente
          </h2>
          <p className="lp-modulos__lead">
            Vendes, y el inventario se actualiza solo. Cierras caja, y el
            reporte ya está listo.
          </p>
        </div>

        <div className="lp-diagrama">
          <div className="lp-diagrama__centro">Un solo sistema</div>

          <svg
            className="lp-diagrama__conectores"
            viewBox="0 0 1200 140"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 600 0 V 24 C 600 44, 588 44, 568 44 H 170 C 150 44, 150 44, 150 64 V 80" />
            <path d="M 600 0 V 24 C 600 44, 592 44, 572 44 H 470 C 450 44, 450 44, 450 64 V 80" />
            <path d="M 600 0 V 24 C 600 44, 608 44, 628 44 H 730 C 750 44, 750 44, 750 64 V 80" />
            <path d="M 600 0 V 24 C 600 44, 612 44, 632 44 H 1030 C 1050 44, 1050 44, 1050 64 V 80" />
          </svg>

          <div className="lp-diagrama__nodos">
            {NODOS.filter((n) => n.fila === "arriba").map((nodo, i) => {
              const Icono = nodo.icono;
              return (
                <div
                  key={nodo.titulo}
                  className="lp-nodo"
                  style={{ transitionDelay: `${420 + i * 90}ms` }}
                >
                  <Icono size={25} strokeWidth={1.6} />
                  <div className="lp-nodo__texto">
                    <p className="lp-nodo__titulo">{nodo.titulo}</p>
                    <p className="lp-nodo__desc">{nodo.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lp-diagrama__nodos lp-diagrama__nodos--abajo">
            {NODOS.filter((n) => n.fila === "abajo").map((nodo, i) => {
              const Icono = nodo.icono;
              return (
                <div
                  key={nodo.titulo}
                  className="lp-nodo"
                  style={{ transitionDelay: `${420 + (i + 4) * 90}ms` }}
                >
                  <Icono size={25} strokeWidth={1.6} />
                  <div className="lp-nodo__texto">
                    <p className="lp-nodo__titulo">{nodo.titulo}</p>
                    <p className="lp-nodo__desc">{nodo.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}