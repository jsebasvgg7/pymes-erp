package com.rowin.contabilidad.dto.caja;

import java.math.BigDecimal;

public record EstadoCajaResponse(
    Long cajaId,
    String cajaNombre,
    boolean abierta,
    boolean requiereCierre,
    AperturaCajaResponse apertura,
    BigDecimal efectivoSugerido
) {
}
