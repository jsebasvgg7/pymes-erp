import Hero from "./Hero";
import LandingNav from "./LandingNav";
import Modulos from "./Modulos";
import "./base.css";

export default function LandingPage() {
  return (
    <div className="lp">
      <LandingNav />
      <main className="lp-main">
        <Hero />
        <Modulos />
      </main>
    </div>
  );
}