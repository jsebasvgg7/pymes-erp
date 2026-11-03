import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import LoadingState from "./LoadingState";
import { usePrecargaRutas } from "../hooks/usePrecargaRutas";
import "./ContenidoProtegido.css";

export default function ContenidoProtegido() {
  usePrecargaRutas();

  return (
    <Suspense
      fallback={
        <div className="contenidoCarga">
          <LoadingState label="Cargando módulo..." />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}
