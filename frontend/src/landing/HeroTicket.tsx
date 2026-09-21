import { ImageIcon } from "lucide-react";

type HeroTicketProps = {
  /** Cuando haya imagen final: importarla desde src/assets y pasarla aquí. */
  src?: string;
  alt?: string;
};

/**
 * Marco de la imagen principal. Su borde inferior en dientes de sierra
 * recuerda a un tiquete de venta recién impreso.
 * Proporción recomendada para la imagen: 4:5 (vertical).
 */
export default function HeroTicket({ src, alt = "" }: HeroTicketProps) {
  return (
    <div className="lp-ticket">
      <div className="lp-ticket__paper">
        {src ? (
          <img className="lp-ticket__img" src={src} alt={alt} />
        ) : (
          <div
            className="lp-ticket__slot"
            role="img"
            aria-label="Espacio reservado para la imagen principal"
          >
            <ImageIcon size={28} strokeWidth={1.6} aria-hidden="true" />
            <span>Aquí irá la imagen principal</span>
          </div>
        )}
      </div>
    </div>
  );
}
