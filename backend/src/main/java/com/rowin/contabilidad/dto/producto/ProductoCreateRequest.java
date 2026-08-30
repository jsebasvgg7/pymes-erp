package com.rowin.contabilidad.dto.producto;

import com.rowin.contabilidad.entities.UnidadMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public record ProductoCreateRequest(
    @NotNull Long empresaId,
    Long categoriaId,
    @Size(max = 60) String sku,
    @NotBlank @Size(max = 200) String nombre,
    @Size(max = 500) String descripcion,
    @NotNull UnidadMedida unidadMedida,
    @NotNull @DecimalMin(value = "0.0") BigDecimal precioVenta,
    @NotNull @DecimalMin(value = "0.0") BigDecimal costo,
    @NotNull @Min(0) BigDecimal stockMinimo,
    @NotNull @Min(0) BigDecimal stockInicial,
    Set<Long> impuestoIds
) {
}
