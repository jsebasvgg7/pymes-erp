import Hero from "./Hero";
import LandingNav from "./LandingNav";
import Soluciones from "./Soluciones";
import Modulos from "./Modulos";
import Beneficios from "./Beneficios";
import "./base.css";

export default function LandingPage() {
  return (
    <div className="lp">
      <LandingNav />
      <main className="lp-main">
        <Hero />
        <Soluciones />
        <Modulos />
        <Beneficios />
      </main>
    </div>
  );
}