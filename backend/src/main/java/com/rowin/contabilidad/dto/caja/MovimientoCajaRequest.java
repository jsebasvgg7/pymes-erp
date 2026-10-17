package com.rowin.contabilidad.dto.caja;

import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.TipoReferenciaMovimientoCaja;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record MovimientoCajaRequest(
    @NotNull Long empresaId,
    @NotNull Long cajaId,
    @NotNull(message = "La forma de pago es obligatoria") Long formaPagoId,
    @NotNull TipoMovimientoCaja tipo,
    @NotNull @DecimalMin(value = "0.01") BigDecimal monto,
    @NotBlank(message = "El concepto del gasto es obligatorio") @Size(max = 255) String descripcion,
    TipoReferenciaMovimientoCaja tipoReferencia,
    Long referenciaId
) {
}
