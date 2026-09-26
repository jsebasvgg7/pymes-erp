import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "./Hero";
import LandingNav from "./LandingNav";
import Soluciones from "./Soluciones";
import Modulos from "./Modulos";
import Beneficios from "./Beneficios";
import Tecnologia from "./Tecnologia";
import RepoStatus from "./RepoStatus";
import Pricing from "./Precios";
import Contacto from "./Contacto";
import Footer from "./Footer";
import "./base.css";

const OFFSETS_SECCION: Record<string, number> = {
  "#beneficios": 145,
  "#tecnologia": 135,
  "#precios": 140,
  "#contacto": 115,
};

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash;
    const compensacion = OFFSETS_SECCION[id] || 0;

    // Espera a que el layout de la landing termine de montar antes de medir posiciones
    const raf = requestAnimationFrame(() => {
      const destino = document.querySelector(id);
      if (!destino) return;

      const top = destino.getBoundingClientRect().top + window.scrollY - 90 + compensacion;
      window.scrollTo({ top, behavior: "smooth" });
    });

    return () => cancelAnimationFrame(raf);
  }, [location.hash]);

  return (
    <div className="lp">
      <LandingNav />
      <main className="lp-main">
        <Hero />
        <Soluciones />
        <Modulos />
        <Beneficios />
        <Tecnologia />
        <RepoStatus />
        <Pricing />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}