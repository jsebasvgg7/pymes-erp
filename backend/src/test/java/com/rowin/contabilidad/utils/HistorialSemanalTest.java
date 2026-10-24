package com.rowin.contabilidad.utils;

import com.rowin.contabilidad.entities.FacturaEstado;
import com.rowin.contabilidad.utils.HistorialSemanal.Linea;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HistorialSemanalTest {

    private static final LocalDate LUNES = LocalDate.of(2026, 10, 19);

    private static Linea linea(LocalDateTime fecha, FacturaEstado estado, String cantidad, String total) {
        return new Linea(fecha, estado, 1L, "Gaseosa", new BigDecimal(cantidad), new BigDecimal(total),
            new BigDecimal(total), BigDecimal.ZERO);
    }

    @Test
    void ventaDelDomingoNocheQuedaEnLaSemanaQueTermina() {
        var res = HistorialSemanal.agrupar(
            List.of(linea(LocalDateTime.of(2026, 10, 25, 23, 30), FacturaEstado.EMITIDA, "2", "6000")),
            LUNES, LUNES.plusWeeks(1));
        assertEquals(2, res.size());
        assertEquals(new BigDecimal("2"), res.get(0).unidades());
        assertEquals(BigDecimal.ZERO, res.get(1).unidades());
    }

    @Test
    void ventaDelLunesALaMedianocheEmpiezaSemanaNueva() {
        var res = HistorialSemanal.agrupar(
            List.of(linea(LocalDateTime.of(2026, 10, 26, 0, 0), FacturaEstado.EMITIDA, "1", "3000")),
            LUNES, LUNES.plusWeeks(1));
        assertEquals(BigDecimal.ZERO, res.get(0).unidades());
        assertEquals(new BigDecimal("1"), res.get(1).unidades());
        assertEquals(LocalDate.of(2026, 10, 26), res.get(1).semanaInicio());
        assertEquals(LocalDate.of(2026, 11, 1), res.get(1).semanaFin());
    }

    @Test
    void anuladasYBorradoresNoCuentan() {
        LocalDateTime miercoles = LocalDateTime.of(2026, 10, 21, 10, 0);
        var res = HistorialSemanal.agrupar(List.of(
            linea(miercoles, FacturaEstado.EMITIDA, "1", "1000"),
            linea(miercoles, FacturaEstado.PAGADA, "2", "2000"),
            linea(miercoles, FacturaEstado.ANULADA, "50", "50000"),
            linea(miercoles, FacturaEstado.BORRADOR, "70", "70000")), LUNES, LUNES);
        assertEquals(1, res.size());
        assertEquals(new BigDecimal("3"), res.get(0).unidades());
        assertEquals(new BigDecimal("3000.00"), res.get(0).ventaNeta());
    }

    @Test
    void elDescuentoSeReparteProporcionalmente() {
        var l = new Linea(LocalDateTime.of(2026, 10, 21, 10, 0), FacturaEstado.EMITIDA, 1L, "Gaseosa",
            new BigDecimal("1"), new BigDecimal("500"), new BigDecimal("1000"), new BigDecimal("100"));
        var res = HistorialSemanal.agrupar(List.of(l), LUNES, LUNES);
        assertEquals(new BigDecimal("450.00"), res.get(0).ventaNeta());
    }

    @Test
    void productoConMenosDeOchoSemanasQuedaSinDatosSuficientes() {
        var res = HistorialSemanal.agrupar(
            List.of(linea(LocalDateTime.of(2026, 10, 21, 10, 0), FacturaEstado.EMITIDA, "1", "1000")),
            LUNES.minusWeeks(3), LUNES,
            Map.of(1L, LocalDateTime.of(2026, 10, 5, 9, 0)));
        assertEquals(3, res.get(0).semanasDeHistorial());
        assertEquals(true, res.get(0).sinDatosSuficientes());
    }

    @Test
    void productoConOchoSemanasOMasTieneDatosSuficientes() {
        var res = HistorialSemanal.agrupar(
            List.of(linea(LocalDateTime.of(2026, 10, 21, 10, 0), FacturaEstado.EMITIDA, "1", "1000")),
            LUNES.minusWeeks(3), LUNES,
            Map.of(1L, LocalDateTime.of(2026, 8, 31, 9, 0)));
        assertEquals(8, res.get(0).semanasDeHistorial());
        assertEquals(false, res.get(0).sinDatosSuficientes());
    }

    @Test
    void aceptaCantidadesDecimalesPorPeso() {
        var res = HistorialSemanal.agrupar(List.of(
            linea(LocalDateTime.of(2026, 10, 21, 10, 0), FacturaEstado.EMITIDA, "0.5", "5000"),
            linea(LocalDateTime.of(2026, 10, 22, 10, 0), FacturaEstado.EMITIDA, "1.25", "12500")), LUNES, LUNES);
        assertEquals(new BigDecimal("1.75"), res.get(0).unidades());
    }
}