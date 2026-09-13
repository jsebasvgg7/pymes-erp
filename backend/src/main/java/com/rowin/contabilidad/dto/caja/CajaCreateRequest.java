package com.rowin.contabilidad.dto.caja;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CajaCreateRequest(
    @NotNull Long empresaId,
    @NotBlank @Size(max = 120) String nombre,
    @DecimalMin(value = "0.0") BigDecimal saldoInicial
) {
}
