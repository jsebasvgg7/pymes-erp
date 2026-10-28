export type EtiquetaMovimiento = "Ingreso" | "Egreso" | "Gasto";

export function etiquetaMovimiento(tipo: string, tipoReferencia?: string | null): EtiquetaMovimiento {
    if (tipo === "INGRESO") return "Ingreso";
    return tipoReferencia === "GASTO" ? "Gasto" : "Egreso";
}
