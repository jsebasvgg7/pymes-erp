package com.rowin.contabilidad.dto.caja;

import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.TipoReferenciaMovimientoCaja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MovimientoCajaResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    Long cajaId,
    String cajaNombre,
    Long formaPagoId,
    String formaPagoNombre,
    LocalDateTime fecha,
    TipoMovimientoCaja tipo,
    BigDecimal monto,
    String descripcion,
    TipoReferenciaMovimientoCaja tipoReferencia,
    Long referenciaId
) {
}
