package com.rowin.contabilidad.utils;

import com.rowin.contabilidad.dto.factura.VentaSemanalProductoResponse;
import com.rowin.contabilidad.entities.FacturaEstado;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Agrupa líneas de factura por producto y por semana (lunes a domingo). */
public final class HistorialSemanal {

    /** Un producto con menos semanas de historia que esto queda como «sin datos suficientes» (AC5). */
    public static final int MIN_SEMANAS_HISTORIAL = 8;

    private HistorialSemanal() {
    }

    /** Una línea de factura con los datos mínimos para el historial. */
    public record Linea(
        LocalDateTime fechaEmision,
        FacturaEstado estado,
        Long productoId,
        String producto,
        BigDecimal cantidad,
        BigDecimal totalLinea,
        BigDecimal subtotalFactura,
        BigDecimal descuentoFactura
    ) {
    }

    public static LocalDate inicioSemana(LocalDate fecha) {
        return fecha.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static List<VentaSemanalProductoResponse> agrupar(List<Linea> lineas, LocalDate semanaInicial, LocalDate semanaFinal) {
        return agrupar(lineas, semanaInicial, semanaFinal, Map.of());
    }

    /**
     * Devuelve una fila por producto y por semana del rango, con 0 en las semanas sin ventas
     * (para estimar demanda, una semana sin ventas es un dato, no un hueco).
     * Solo cuentan los estados de {@link FacturaEstado#VENTAS_VALIDAS}.
     *
     * @param primeraVentaPorProducto fecha de la primera venta válida de cada producto (de toda su vida),
     *                                para calcular cuántas semanas de historia tiene. Si falta un producto,
     *                                se usa la primera venta que aparece en {@code lineas}.
     */
    public static List<VentaSemanalProductoResponse> agrupar(
        List<Linea> lineas,
        LocalDate semanaInicial,
        LocalDate semanaFinal,
        Map<Long, LocalDateTime> primeraVentaPorProducto
    ) {
        LocalDate desde = inicioSemana(semanaInicial);
        LocalDate hasta = inicioSemana(semanaFinal);

        Map<Long, String> nombres = new TreeMap<>();
        Map<Long, Map<LocalDate, BigDecimal[]>> acumulado = new LinkedHashMap<>();
        Map<Long, LocalDate> primeraSemanaVista = new TreeMap<>();

        for (Linea l : lineas) {
            if (l.estado() == null || !l.estado().cuentaComoVenta() || l.productoId() == null) {
                continue;
            }
            LocalDate semana = inicioSemana(l.fechaEmision().toLocalDate());
            if (semana.isBefore(desde) || semana.isAfter(hasta)) {
                continue;
            }
            nombres.putIfAbsent(l.productoId(), l.producto());
            primeraSemanaVista.merge(l.productoId(), semana, (a, b) -> a.isBefore(b) ? a : b);
            BigDecimal[] celda = acumulado
                .computeIfAbsent(l.productoId(), k -> new TreeMap<>())
                .computeIfAbsent(semana, k -> new BigDecimal[] {BigDecimal.ZERO, BigDecimal.ZERO});
            celda[0] = celda[0].add(l.cantidad());
            celda[1] = celda[1].add(netoDeLinea(l));
        }

        List<VentaSemanalProductoResponse> resultado = new ArrayList<>();
        for (Map.Entry<Long, String> producto : nombres.entrySet()) {
            Long id = producto.getKey();
            LocalDateTime primera = primeraVentaPorProducto.get(id);
            LocalDate primeraSemana = primera != null ? inicioSemana(primera.toLocalDate()) : primeraSemanaVista.get(id);
            int semanasDeHistorial = (int) ChronoUnit.WEEKS.between(primeraSemana, hasta) + 1;
            boolean sinDatos = semanasDeHistorial < MIN_SEMANAS_HISTORIAL;

            Map<LocalDate, BigDecimal[]> porSemana = acumulado.get(id);
            for (LocalDate semana = desde; !semana.isAfter(hasta); semana = semana.plusWeeks(1)) {
                BigDecimal[] celda = porSemana.getOrDefault(semana, new BigDecimal[] {BigDecimal.ZERO, BigDecimal.ZERO});
                resultado.add(new VentaSemanalProductoResponse(
                    semana, semana.plusDays(6), id, producto.getValue(),
                    celda[0], celda[1].setScale(2, RoundingMode.HALF_UP),
                    semanasDeHistorial, sinDatos));
            }
        }
        return resultado;
    }

    /** Valor de la línea descontando la parte proporcional del descuento de la factura. */
    private static BigDecimal netoDeLinea(Linea l) {
        if (l.subtotalFactura() != null && l.subtotalFactura().signum() > 0 && l.descuentoFactura() != null) {
            BigDecimal descuento = l.descuentoFactura().multiply(l.totalLinea())
                .divide(l.subtotalFactura(), 6, RoundingMode.HALF_UP);
            return l.totalLinea().subtract(descuento);
        }
        return l.totalLinea();
    }
}