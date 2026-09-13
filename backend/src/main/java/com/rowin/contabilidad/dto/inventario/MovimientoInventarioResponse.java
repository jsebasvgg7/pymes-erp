package com.rowin.contabilidad.dto.inventario;

import com.rowin.contabilidad.entities.TipoMovimientoInventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MovimientoInventarioResponse(
    Long id,
    LocalDateTime createdAt,
    boolean active,
    Long empresaId,
    Long productoId,
    String productoNombre,
    Long usuarioId,
    String usuarioUsername,
    TipoMovimientoInventario tipo,
    BigDecimal cantidadAnterior,
    BigDecimal cantidadNueva,
    BigDecimal diferencia,
    String motivo,
    String notas
) {
}
