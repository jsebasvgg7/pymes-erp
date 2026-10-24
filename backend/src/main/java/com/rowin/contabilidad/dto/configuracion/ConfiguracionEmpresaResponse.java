package com.rowin.contabilidad.dto.configuracion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ConfiguracionEmpresaResponse(
    Long empresaId,
    LocalDateTime updatedAt,
    String moneda,
    String simboloMoneda,
    String formatoFecha,
    boolean clienteObligatorio,
    Integer diasVencimientoCredito,
    boolean codigoBarrasActivo,
    BigDecimal stockMinimoDefecto,
    boolean avisarStockBajo,
    String horaCierreAutomatico,
    int anchoRecibo,
    String nombreRecibo,
    String mensajePieRecibo
) {
}
