package com.rowin.contabilidad.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CajaResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    String nombre,
    BigDecimal saldoInicial,
    BigDecimal saldoActual
) {
}
