package com.rowin.contabilidad.dto.detalle;

import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;

import java.math.BigDecimal;
import java.util.Set;

public record DetalleFacturaResponse(
    Long id,
    Long productoId,
    String productoNombre,
    String descripcion,
    BigDecimal cantidad,
    BigDecimal precioUnitario,
    BigDecimal totalLinea,
    Set<ImpuestoResponse> impuestos
) {
}
