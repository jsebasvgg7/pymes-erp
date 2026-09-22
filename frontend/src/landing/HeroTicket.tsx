import { ImageIcon } from "lucide-react";
import heroIllustration from "../assets/hero-illustration.png";

type HeroTicketProps = {
  src?: string;
  alt?: string;
};

export default function HeroTicket({
  src = heroIllustration,
  alt = "Ilustración de un negocio usando PYMES ERP en el punto de venta",
}: HeroTicketProps) {
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