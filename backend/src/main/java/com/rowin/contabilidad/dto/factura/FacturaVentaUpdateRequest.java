package com.rowin.contabilidad.dto.factura;

import com.rowin.contabilidad.entities.FacturaEstado;

public record FacturaVentaUpdateRequest(
    FacturaEstado estado
) {
}
