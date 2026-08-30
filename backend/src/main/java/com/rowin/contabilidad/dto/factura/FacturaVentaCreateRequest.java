package com.rowin.contabilidad.dto.factura;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FacturaVentaCreateRequest(
    @NotNull Long empresaId,
    Long clienteId,
    @NotNull Long formaPagoId,
    @Size(max = 40) String numero,
    List<DetalleFacturaRequest> detalles
) {
}
