package com.rowin.contabilidad.dto.factura;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaResponse;
import com.rowin.contabilidad.entities.FacturaEstado;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FacturaVentaResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    Long clienteId,
    String clienteNombre,
    Long formaPagoId,
    String formaPagoNombre,
    String numero,
    LocalDateTime fechaEmision,
    FacturaEstado estado,
    BigDecimal subtotal,
    BigDecimal totalImpuestos,
    BigDecimal total,
    List<DetalleFacturaResponse> detalles
) {
}
