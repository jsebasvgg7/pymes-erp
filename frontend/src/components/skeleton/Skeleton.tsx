import type { CSSProperties, ReactNode } from "react";
import "./Skeleton.css";

type Medida = string | number;

interface BloqueProps {
  ancho?: Medida;
  alto?: Medida;
  radio?: Medida;
  circulo?: boolean;
  className?: string;
}

function medida(valor: Medida | undefined): string | undefined {
  if (valor === undefined) return undefined;
  return typeof valor === "number" ? `${valor}px` : valor;
}

export function Bloque({ ancho, alto = 14, radio, circulo = false, className }: BloqueProps) {
  const estilo: CSSProperties = {
    width: medida(ancho),
    height: medida(alto),
    borderRadius: circulo ? "50%" : medida(radio)
  };
  return <span className={className ? `sk ${className}` : "sk"} style={estilo} />;
}

export function SkeletonEncabezado({ acciones = 1 }: { acciones?: number }) {
  return (
    <div className="sk-encabezado">
      <div className="sk-encabezado__texto">
        <Bloque ancho={220} alto={24} radio={8} />
        <Bloque ancho="min(320px, 70%)" alto={13} />
      </div>
      <div className="sk-encabezado__acciones">
        {Array.from({ length: acciones }, (_, i) => (
          <Bloque key={i} ancho={116} alto={38} radio={10} />
        ))}
      </div>
    </div>
  );
}

interface SkeletonTarjetasProps {
  cantidad?: number;
  minimo?: number;
}

export function SkeletonTarjetas({ cantidad = 4, minimo = 220 }: SkeletonTarjetasProps) {
  const estilo = { "--sk-min": `${minimo}px` } as CSSProperties;
  return (
    <div className="sk-tarjetas" style={estilo}>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="sk-tarjeta">
          <div className="sk-tarjeta__cabeza">
            <Bloque ancho={44} alto={44} radio={12} />
            <div className="sk-tarjeta__texto">
              <Bloque ancho="60%" alto={11} />
              <Bloque ancho="40%" alto={20} radio={6} />
            </div>
          </div>
          <Bloque alto={36} radio={10} />
        </div>
      ))}
    </div>
  );
}

interface SkeletonListaProps {
  filas?: number;
  conTitulo?: boolean;
}

export function SkeletonLista({ filas = 8, conTitulo = true }: SkeletonListaProps) {
  return (
    <div className="sk-lista">
      {conTitulo ? (
        <div className="sk-lista__cabeza">
          <Bloque ancho={140} alto={16} radio={6} />
          <Bloque ancho={28} alto={13} />
        </div>
      ) : null}
      <div className="sk-lista__cuerpo">
        {Array.from({ length: filas }, (_, i) => (
          <div key={i} className="sk-lista__fila">
            <div className="sk-lista__principal">
              <Bloque ancho="55%" alto={14} />
              <Bloque ancho="35%" alto={12} />
            </div>
            <Bloque ancho="70%" alto={22} radio={6} className="sk-lista__etiqueta" />
            <Bloque ancho={72} alto={22} radio={999} className="sk-lista__estado" />
            <Bloque ancho={64} alto={14} className="sk-lista__valor" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkeletonMosaicoProps {
  cantidad?: number;
  minimo?: number;
  cuadrado?: boolean;
  altoMinimo?: number;
  relleno?: number;
  pie?: boolean;
}

export function SkeletonMosaico({
  cantidad = 8,
  minimo = 240,
  cuadrado = false,
  altoMinimo,
  relleno,
  pie = false
}: SkeletonMosaicoProps) {
  const estilo = {
    "--sk-min": `${minimo}px`,
    ...(altoMinimo !== undefined ? { "--sk-alto": `${altoMinimo}px` } : {}),
    ...(relleno !== undefined ? { "--sk-relleno": `${relleno}px` } : {})
  } as CSSProperties;
  return (
    <div className="sk-mosaico" style={estilo}>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className={cuadrado ? "sk-mosaico__tarjeta sk-mosaico__tarjeta--cuadrada" : "sk-mosaico__tarjeta"}>
          <div className="sk-mosaico__arriba">
            <Bloque ancho={44} alto={44} circulo />
            <Bloque ancho={40} alto={40} radio={12} />
          </div>
          <div className="sk-mosaico__texto">
            <Bloque ancho="65%" alto={16} radio={6} />
            <Bloque ancho="40%" alto={12} />
          </div>
          {pie ? (
            <div className="sk-mosaico__pie">
              <Bloque ancho={84} alto={24} radio={8} />
              <Bloque ancho={64} alto={22} radio={999} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrafica({ alto = 220 }: { alto?: number }) {
  return (
    <div className="sk-grafica">
      <div className="sk-grafica__franja">
        <Bloque ancho={160} alto={14} />
        <Bloque ancho={24} alto={24} circulo />
      </div>
      <div className="sk-grafica__area">
        <Bloque alto={alto} radio={12} />
      </div>
    </div>
  );
}

export function SkeletonFormulario({ campos = 6 }: { campos?: number }) {
  return (
    <div className="sk-formulario">
      {Array.from({ length: campos }, (_, i) => (
        <div key={i} className="sk-formulario__campo">
          <Bloque ancho={120} alto={12} />
          <Bloque alto={42} radio={10} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonResumen({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="sk-resumen">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="sk-resumen__tarjeta">
          <Bloque ancho="55%" alto={11} />
          <Bloque ancho={64} alto={26} radio={6} />
          <Bloque ancho="80%" alto={12} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGraficasFila() {
  return (
    <div className="sk-fila-graficas">
      <SkeletonGrafica />
      <SkeletonGrafica />
    </div>
  );
}

export function SkeletonPanel({ filas = 10 }: { filas?: number }) {
  return (
    <div className="sk-panel">
      <div className="sk-panel__barra">
        <Bloque ancho={280} alto={38} radio={10} />
        <Bloque ancho={140} alto={38} radio={10} />
        <Bloque ancho={150} alto={13} />
      </div>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="sk-lista__fila">
          <div className="sk-lista__principal">
            <Bloque ancho="55%" alto={14} />
            <Bloque ancho="35%" alto={12} />
          </div>
          <Bloque ancho="70%" alto={22} radio={6} className="sk-lista__etiqueta" />
          <Bloque ancho={72} alto={22} radio={999} className="sk-lista__estado" />
          <Bloque ancho={64} alto={14} className="sk-lista__valor" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonControlesProps {
  filtros?: number;
  conteo?: boolean;
}

export function SkeletonControles({ filtros = 0, conteo = false }: SkeletonControlesProps) {
  return (
    <div className="sk-controles">
      <Bloque ancho={300} alto={38} radio={10} />
      {Array.from({ length: filtros }, (_, i) => (
        <Bloque key={i} ancho={150} alto={38} radio={10} />
      ))}
      {conteo ? <Bloque ancho={90} alto={13} /> : null}
    </div>
  );
}

export function SkeletonPeriodo() {
  return (
    <div className="sk-periodo">
      <div className="sk-periodo__campos">
        <Bloque ancho={160} alto={38} radio={10} />
        <Bloque ancho={160} alto={38} radio={10} />
      </div>
      <Bloque ancho="min(520px, 90%)" alto={12} />
    </div>
  );
}

export function SkeletonDosColumnas({ lateral, children }: { lateral: ReactNode; children: ReactNode }) {
  return (
    <div className="sk-dos">
      <div className="sk-dos__principal">{children}</div>
      <div className="sk-dos__lateral">{lateral}</div>
    </div>
  );
}

export function SkeletonLateral({ filas = 5 }: { filas?: number }) {
  return (
    <div className="sk-lateral">
      <Bloque ancho="50%" alto={16} radio={6} />
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="sk-lateral__fila">
          <Bloque ancho="45%" alto={13} />
          <Bloque ancho={40} alto={13} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPos({ filas = 8 }: { filas?: number }) {
  return (
    <div className="sk-pos">
      <div className="sk-pos__catalogo">
        <div className="sk-pos__cabeza">
          <Bloque ancho={140} alto={20} radio={6} />
          <Bloque ancho={250} alto={36} radio={10} className="sk-pos__buscador" />
        </div>
        <div className="sk-pos__chips">
          {[64, 96, 84, 110].map((ancho) => (
            <Bloque key={ancho} ancho={ancho} alto={32} radio={999} />
          ))}
        </div>
        <div className="sk-pos__lista">
          {Array.from({ length: filas }, (_, i) => (
            <div key={i} className="sk-pos__fila">
              <Bloque ancho={48} alto={48} radio={12} />
              <div className="sk-pos__info">
                <Bloque ancho={72} alto={14} radio={999} />
                <Bloque ancho="55%" alto={14} />
                <Bloque ancho="35%" alto={11} />
              </div>
              <Bloque ancho={64} alto={14} />
            </div>
          ))}
        </div>
      </div>
      <div className="sk-pos__pedido">
        <Bloque ancho={160} alto={24} radio={6} />
        <div className="sk-pos__tarjeta">
          <div className="sk-pos__lineas">
            {[0, 1, 2].map((i) => (
              <div key={i} className="sk-pos__linea">
                <Bloque ancho="55%" alto={13} />
                <Bloque ancho={64} alto={13} />
              </div>
            ))}
          </div>
          <div className="sk-pos__resumen">
            <div className="sk-pos__linea">
              <Bloque ancho={70} alto={13} />
              <Bloque ancho={72} alto={13} />
            </div>
            <div className="sk-pos__linea">
              <Bloque ancho={90} alto={13} />
              <Bloque ancho={72} alto={13} />
            </div>
            <Bloque alto={44} radio={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonAjustesProps {
  modulos?: number;
  filas?: number;
}

export function SkeletonAjustes({ modulos = 7, filas = 7 }: SkeletonAjustesProps) {
  return (
    <div className="sk-ajustes">
      <div className="sk-ajustes__menu">
        {Array.from({ length: modulos }, (_, i) => (
          <Bloque key={i} alto={42} radio={10} className="sk-ajustes__item" />
        ))}
      </div>
      <div className="sk-ajustes__panel">
        <div className="sk-ajustes__cabeza">
          <Bloque ancho={44} alto={44} radio={14} />
          <div className="sk-ajustes__texto">
            <Bloque ancho={160} alto={18} radio={6} />
            <Bloque ancho="min(320px, 70%)" alto={13} />
          </div>
        </div>
        <div className="sk-ajustes__filas">
          {Array.from({ length: filas }, (_, i) => (
            <div key={i} className="sk-ajustes__fila">
              <div className="sk-ajustes__info">
                <Bloque ancho="45%" alto={14} />
                <Bloque ancho="70%" alto={12} />
              </div>
              <Bloque ancho="60%" alto={14} />
              <Bloque ancho={72} alto={32} radio={10} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
