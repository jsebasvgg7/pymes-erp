package com.rowin.contabilidad.dto.factura;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Ventas de un producto en una semana (lunes a domingo, hora de Colombia). */
public record VentaSemanalProductoResponse(
    LocalDate semanaInicio,
    LocalDate semanaFin,
    Long productoId,
    String producto,
    BigDecimal unidades,
    BigDecimal ventaNeta,
    int semanasDeHistorial,
    boolean sinDatosSuficientes
) {
}