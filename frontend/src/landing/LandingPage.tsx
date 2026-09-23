import Hero from "./Hero";
import LandingNav from "./LandingNav";
import Soluciones from "./Soluciones";
import Modulos from "./Modulos";
import Beneficios from "./Beneficios";
import Tecnologia from "./Tecnologia";
import RepoStatus from "./RepoStatus";
import Contacto from "./Contacto";
import Footer from "./Footer";
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
        <Tecnologia />
        <RepoStatus />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}