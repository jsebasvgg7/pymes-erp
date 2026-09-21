import HeroTicket from "./HeroTicket";

export default function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__copy">
          <h1 id="lp-hero-title" className="lp-hero__title">
            Tu negocio vende. La contabilidad se hace sola.
          </h1>

          <p className="lp-hero__lead">
            Punto de venta, inventario, compras y caja en un solo sistema,
            pensado para tiendas, restaurantes, cafeterías y panaderías.
          </p>

          <div className="lp-hero__actions">
            <a href="#contacto" className="lp-btn lp-btn--primary">
              Solicitar una demo
            </a>
            <a href="#modulos" className="lp-btn lp-btn--ghost">
              Ver los módulos
            </a>
          </div>

          <p className="lp-hero__credit">
            Desarrollado en Cartagena de Indias por estudiantes de Tecnología
            en Desarrollo de Software del Tecnológico Comfenalco.
          </p>
        </div>

        <HeroTicket />
      </div>
    </section>
  );
}
