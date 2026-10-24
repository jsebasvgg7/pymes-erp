package com.rowin.contabilidad.dto.caja;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AperturaCajaRequest(
    @NotNull(message = "El efectivo inicial es obligatorio")
    @DecimalMin(value = "0.00", message = "El efectivo inicial no puede ser negativo")
    BigDecimal efectivoInicial
) {
}
