package com.rowin.contabilidad.dto.inventario;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventarioSemanalResponse(
    LocalDate semanaInicio,
    Long productoId,
    String producto,
    BigDecimal cantidad
) {
}