package com.rowin.contabilidad.dto.factura;

import java.math.BigDecimal;

public record CategoriaVentaResponse(
    String categoria,
    BigDecimal total
) {
}
