package com.rowin.contabilidad.dto.inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InventarioResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    Long productoId,
    String productoNombre,
    String productoSku,
    String categoriaNombre,
    String unidadMedida,
    BigDecimal cantidadActual,
    BigDecimal costoPromedio,
    BigDecimal stockMinimo,
    BigDecimal precioVenta,
    boolean stockBajo
) {
}
