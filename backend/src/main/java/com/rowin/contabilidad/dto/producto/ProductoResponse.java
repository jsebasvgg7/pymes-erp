package com.rowin.contabilidad.dto.producto;

import com.rowin.contabilidad.entities.UnidadMedida;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public record ProductoResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    Long categoriaId,
    String categoriaNombre,
    String sku,
    String nombre,
    String descripcion,
    UnidadMedida unidadMedida,
    BigDecimal precioVenta,
    BigDecimal costo,
    BigDecimal stockMinimo,
    BigDecimal stockActual,
    BigDecimal costoPromedio,
    Set<ImpuestoResponse> impuestos
) {
}
