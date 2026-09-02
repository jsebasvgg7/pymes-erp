package com.rowin.contabilidad.dto.caja;

import java.math.BigDecimal;

public record CajaResumenResponse(
    Long cajaId,
    String cajaNombre,
    BigDecimal saldoInicial,
    BigDecimal saldoActual,
    BigDecimal totalIngresos,
    BigDecimal totalEgresos,
    int totalMovimientos
) {
}
