package com.rowin.contabilidad.dto.caja;

import com.rowin.contabilidad.entities.EstadoAperturaCaja;
import com.rowin.contabilidad.entities.ResultadoCierreCaja;
import com.rowin.contabilidad.entities.TipoCierreCaja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AperturaCajaResponse(
    Long id,
    Long cajaId,
    String cajaNombre,
    EstadoAperturaCaja estado,
    Long usuarioAperturaId,
    String usuarioAperturaNombre,
    LocalDateTime fechaApertura,
    BigDecimal efectivoInicial,
    Long usuarioCierreId,
    String usuarioCierreNombre,
    LocalDateTime fechaCierre,
    BigDecimal efectivoEsperado,
    BigDecimal efectivoContado,
    BigDecimal diferencia,
    TipoCierreCaja tipoCierre,
    ResultadoCierreCaja resultado,
    boolean requiereCierre
) {
}
