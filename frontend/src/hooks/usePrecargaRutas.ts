import { useEffect } from "react";
import { precargarRuta } from "../routes/paginas";

export function usePrecargaRutas() {
  useEffect(() => {
    const alApuntar = (evento: Event) => {
      const objetivo = evento.target;
      if (!(objetivo instanceof Element)) return;
      const enlace = objetivo.closest("a[href]");
      const href = enlace?.getAttribute("href");
      if (href) precargarRuta(href);
    };

    document.addEventListener("pointerover", alApuntar, { passive: true });
    document.addEventListener("focusin", alApuntar);

    return () => {
      document.removeEventListener("pointerover", alApuntar);
      document.removeEventListener("focusin", alApuntar);
    };
  }, []);
}
