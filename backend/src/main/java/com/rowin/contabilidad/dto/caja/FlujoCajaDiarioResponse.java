package com.rowin.contabilidad.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FlujoCajaDiarioResponse(
    LocalDate fecha,
    BigDecimal ingreso,
    BigDecimal egreso
) {
}
