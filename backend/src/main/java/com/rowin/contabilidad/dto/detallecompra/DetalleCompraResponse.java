package com.rowin.contabilidad.dto.detallecompra;

import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;

import java.math.BigDecimal;
import java.util.Set;

public record DetalleCompraResponse(
    Long id,
    Long productoId,
    String productoNombre,
    String descripcion,
    BigDecimal cantidad,
    BigDecimal costoUnitario,
    BigDecimal totalLinea,
    Set<ImpuestoResponse> impuestos
) {
}
