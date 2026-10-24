package com.rowin.contabilidad.dto.detalle;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public record DetalleFacturaRequest(
    Long productoId,
    @NotBlank @Size(max = 255) String descripcion,
    @NotNull @DecimalMin(value = "0.001") BigDecimal cantidad,
    @NotNull @DecimalMin(value = "0.0") BigDecimal precioUnitario,
    Set<Long> impuestoIds
) {
}
