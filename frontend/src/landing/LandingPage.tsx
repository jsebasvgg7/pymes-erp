import Hero from "./Hero";
import LandingNav from "./LandingNav";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="lp">
      <LandingNav />
      <main className="lp-main">
        <Hero />
      </main>
    </div>
  );
}
