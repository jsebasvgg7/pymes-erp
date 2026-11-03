import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import LoadingState from "./LoadingState";
import { usePrecargaRutas } from "../hooks/usePrecargaRutas";
import { paginaDesdeRuta } from "../utils/frasesCarga";
import "./ContenidoProtegido.css";

export default function ContenidoProtegido() {
  usePrecargaRutas();
  const { pathname } = useLocation();

  return (
    <Suspense
      fallback={
        <div className="contenidoCarga">
          <LoadingState label="Cargando módulo..." pagina={paginaDesdeRuta(pathname)} />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}
