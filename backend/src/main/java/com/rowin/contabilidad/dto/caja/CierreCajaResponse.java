package com.rowin.contabilidad.dto.caja;

import java.math.BigDecimal;

public record CierreCajaResponse(
    AperturaCajaResponse apertura,
    BigDecimal ingresosOtrosMedios,
    BigDecimal egresosOtrosMedios
) {
}
