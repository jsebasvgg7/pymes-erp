package com.rowin.contabilidad.dto.factura;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record FacturaVentaCreateRequest(
    @NotNull Long empresaId,
    Long clienteId,
    @NotNull Long formaPagoId,
    @Size(max = 40) String numero,
    @DecimalMin(value = "0.0") BigDecimal descuento,
    List<DetalleFacturaRequest> detalles
) {
}
