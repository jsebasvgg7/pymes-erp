package com.rowin.contabilidad.dto.inventario;

import com.rowin.contabilidad.entities.TipoMovimientoInventario;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AjusteStockRequest(
    @NotNull Long empresaId,
    @NotNull Long productoId,
    Long usuarioId,
    @NotNull TipoMovimientoInventario tipo,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal cantidad,
    @NotBlank @Size(max = 120) String motivo,
    @Size(max = 500) String notas
) {
}
