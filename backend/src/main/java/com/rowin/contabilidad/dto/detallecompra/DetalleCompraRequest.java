package com.rowin.contabilidad.dto.detallecompra;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public record DetalleCompraRequest(
    Long productoId,
    @NotBlank @Size(max = 255) String descripcion,
    @Min(1) BigDecimal cantidad,
    @DecimalMin(value = "0.0") BigDecimal costoUnitario,
    Set<Long> impuestoIds
) {
}
