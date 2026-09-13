package com.rowin.contabilidad.dto.producto;

import com.rowin.contabilidad.entities.UnidadMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Set;

public record ProductoUpdateRequest(
    @NotBlank @Size(max = 200) String nombre,
    @Size(max = 500) String descripcion,
    UnidadMedida unidadMedida,
    Long categoriaId,
    @DecimalMin(value = "0.0") BigDecimal precioVenta,
    @DecimalMin(value = "0.0") BigDecimal costo,
    @Min(0) BigDecimal stockMinimo,
    Set<Long> impuestoIds
) {
}
