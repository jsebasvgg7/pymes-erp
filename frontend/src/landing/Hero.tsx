import LoadingButton from "./LoadingButton";
import HeroTicket from "./HeroTicket";
import "./hero.css";
import "./loading-button.css";

export default function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__copy">
          <h1 id="lp-hero-title" className="lp-hero__title">
            Tu negocio vende. La contabilidad se hace sola.
          </h1>

          <p className="lp-hero__lead">
            Registra ventas, controla tu inventario y gestiona tu caja en
            un solo lugar. Pensado para tiendas, restaurantes, cafeterías
            y panaderías.
          </p>

          <div className="lp-hero__actions">
            <LoadingButton scrollTo="#contacto" className="lp-btn--primary">
              Saber más
            </LoadingButton>
            <a
              href="#modulos"
              className="lp-btn lp-btn--ghost"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#modulos")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver los módulos
            </a>
          </div>

          <p className="lp-hero__credit">
            Diseñado para negocios como el tuyo. Ligero, sin costos ocultos
            ni configuraciones imposibles. Solo enfoca en crecer.
          </p>
        </div>

        <HeroTicket />
      </div>
    </section>
  );
}