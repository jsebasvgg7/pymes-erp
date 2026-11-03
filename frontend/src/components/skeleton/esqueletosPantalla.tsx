import type { ReactNode } from "react";
import type { ClaveCarga } from "../../utils/frasesCarga";
import { MODULOS_CONFIG } from "../../utils/configuracionModulos";
import {
  SkeletonAjustes,
  SkeletonControles,
  SkeletonEncabezado,
  SkeletonGraficasFila,
  SkeletonLista,
  SkeletonMosaico,
  SkeletonPanel,
  SkeletonPeriodo,
  SkeletonPos,
  SkeletonResumen,
  SkeletonTarjetas,
  SkeletonDosColumnas,
  SkeletonLateral
} from "./Skeleton";

const ESQUELETOS: Partial<Record<ClaveCarga, () => ReactNode>> = {
  dashboard: () => (
    <>
      <SkeletonEncabezado acciones={2} />
      <SkeletonTarjetas cantidad={5} minimo={250} />
      <SkeletonGraficasFila />
      <SkeletonLista filas={6} />
    </>
  ),
  pronosticos: () => (
    <>
      <SkeletonEncabezado acciones={2} />
      <SkeletonResumen cantidad={4} />
      <SkeletonPanel filas={10} />
    </>
  ),
  clientes: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonControles conteo />
      <SkeletonLista filas={8} conTitulo={false} />
    </>
  ),
  productos: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonControles filtros={1} />
      <SkeletonLista filas={10} />
    </>
  ),
  inventario: () => (
    <>
      <SkeletonEncabezado acciones={0} />
      <SkeletonControles filtros={2} />
      <SkeletonLista filas={10} />
    </>
  ),
  compras: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonLista filas={10} />
    </>
  ),
  usuarios: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonControles />
      <SkeletonDosColumnas lateral={<SkeletonLateral />}>
        <SkeletonMosaico cantidad={8} minimo={209} cuadrado />
      </SkeletonDosColumnas>
    </>
  ),
  reportes: () => (
    <>
      <SkeletonEncabezado acciones={0} />
      <SkeletonPeriodo />
      <SkeletonTarjetas cantidad={4} />
      <SkeletonLista filas={5} />
      <SkeletonLista filas={5} />
    </>
  ),
  categorias: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonControles />
      <SkeletonMosaico cantidad={8} minimo={240} altoMinimo={176} relleno={20} />
    </>
  ),
  proveedores: () => (
    <>
      <SkeletonEncabezado acciones={1} />
      <SkeletonControles conteo />
      <SkeletonMosaico cantidad={8} minimo={260} altoMinimo={188} relleno={20} pie />
    </>
  ),
  caja: () => (
    <>
      <SkeletonEncabezado acciones={3} />
      <SkeletonResumen cantidad={4} />
      <SkeletonLista filas={8} />
      <SkeletonLista filas={3} />
    </>
  ),
  pos: () => (
    <>
      <SkeletonEncabezado acciones={0} />
      <SkeletonPos filas={8} />
    </>
  ),
  configuracion: () => (
    <>
      <SkeletonEncabezado acciones={0} />
      <SkeletonAjustes modulos={MODULOS_CONFIG.length} filas={MODULOS_CONFIG[0].filas.length} />
    </>
  )
};

export function tieneEsqueleto(clave: ClaveCarga): boolean {
  return ESQUELETOS[clave] !== undefined;
}

export function esqueletoDe(clave: ClaveCarga): ReactNode {
  const construir = ESQUELETOS[clave];
  return construir ? construir() : null;
}
