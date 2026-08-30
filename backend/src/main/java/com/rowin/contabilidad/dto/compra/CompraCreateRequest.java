package com.rowin.contabilidad.dto.compra;

import com.rowin.contabilidad.dto.detallecompra.DetalleCompraRequest;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record CompraCreateRequest(
    @NotNull Long empresaId,
    @NotNull Long proveedorId,
    Long formaPagoId,
    @Size(max = 60) String numeroDocumento,
    LocalDateTime fechaCompra,
    List<DetalleCompraRequest> detalles
) {
}
