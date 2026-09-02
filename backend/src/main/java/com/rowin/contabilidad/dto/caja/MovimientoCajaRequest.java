package com.rowin.contabilidad.dto.caja;

import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.TipoReferenciaMovimientoCaja;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MovimientoCajaRequest(
    @NotNull Long empresaId,
    @NotNull Long cajaId,
    Long formaPagoId,
    @NotNull TipoMovimientoCaja tipo,
    @NotNull @DecimalMin(value = "0.01") BigDecimal monto,
    @Size(max = 255) String descripcion,
    TipoReferenciaMovimientoCaja tipoReferencia,
    Long referenciaId
) {
}
