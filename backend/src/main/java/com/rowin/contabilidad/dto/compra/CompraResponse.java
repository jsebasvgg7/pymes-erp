package com.rowin.contabilidad.dto.compra;

import com.rowin.contabilidad.dto.detallecompra.DetalleCompraResponse;
import com.rowin.contabilidad.entities.CompraEstado;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CompraResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    Long proveedorId,
    String proveedorNombre,
    Long formaPagoId,
    String formaPagoNombre,
    String numeroDocumento,
    LocalDateTime fechaCompra,
    LocalDateTime fechaVencimiento,
    CompraEstado estado,
    BigDecimal subtotal,
    BigDecimal totalImpuestos,
    BigDecimal total,
    List<DetalleCompraResponse> detalles
) {
}
