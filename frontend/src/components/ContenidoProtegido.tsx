import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CargaPagina from "./CargaPagina";
import LoadingState from "./LoadingState";
import { tieneEsqueleto } from "./skeleton/esqueletosPantalla";
import { usePrecargaRutas } from "../hooks/usePrecargaRutas";
import { paginaDesdeRuta } from "../utils/frasesCarga";
import "./ContenidoProtegido.css";

export default function ContenidoProtegido() {
  usePrecargaRutas();
  const { pathname } = useLocation();

  const pagina = paginaDesdeRuta(pathname);
  const fallback = tieneEsqueleto(pagina) ? (
    <CargaPagina pagina={pagina} />
  ) : (
    <div className="contenidoCarga">
      <LoadingState label="Cargando módulo..." pagina={pagina} />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <Outlet />
    </Suspense>
  );
}
