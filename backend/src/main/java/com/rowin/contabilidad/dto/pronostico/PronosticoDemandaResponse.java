package com.rowin.contabilidad.dto.pronostico;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PronosticoDemandaResponse(
    Long id,
    ProductoResumen producto,
    LocalDate semanaPronosticada,
    BigDecimal unidadesProyectadas,
    BigDecimal ventasSemanaAnterior,
    BigDecimal variacionPorcentual,
    LocalDateTime fechaCalculo
) {

    public record ProductoResumen(Long id, String nombre, String codigo) {
    }
}
