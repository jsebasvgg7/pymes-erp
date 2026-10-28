package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.factura.VentaSemanalProductoResponse;
import com.rowin.contabilidad.dto.pronostico.PronosticoDemandaResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.PronosticoDemanda;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.PronosticoDemandaRepository;
import com.rowin.contabilidad.services.ml.ArbolDemanda;
import com.rowin.contabilidad.utils.HistorialSemanal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PronosticoServiceTest {

    private static final Long EMPRESA_ID = 1L;
    private static final Long PRODUCTO_ID = 10L;
    private static final LocalDate SEMANA = HistorialSemanal.inicioSemana(LocalDate.now());

    @Mock
    private PronosticoDemandaRepository pronosticoDemandaRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private FacturaVentaService facturaVentaService;
    @Mock
    private ArbolDemanda arbolDemanda;

    @InjectMocks
    private PronosticoServiceImpl servicio;

    @Test
    void alimentaElArbolConLasVentasRealesYSemUnoEsLaMasReciente() {
        prepararRecalculo(List.of(
                fila(SEMANA, "99", false),
                fila(SEMANA.minusWeeks(1), "4", false),
                fila(SEMANA.minusWeeks(2), "6", false),
                fila(SEMANA.minusWeeks(3), "8", false),
                fila(SEMANA.minusWeeks(4), "10", false)));
        when(arbolDemanda.proyectar(any())).thenReturn(25.0);
        when(arbolDemanda.getVersion()).thenReturn("1.1");

        servicio.recalcularPronosticos(EMPRESA_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Double>> captor = ArgumentCaptor.forClass(Map.class);
        verify(arbolDemanda).proyectar(captor.capture());
        Map<String, Double> vector = captor.getValue();

        assertEquals(4.0, vector.get("ventas_sem_1"));
        assertEquals(6.0, vector.get("ventas_sem_2"));
        assertEquals(8.0, vector.get("ventas_sem_3"));
        assertEquals(10.0, vector.get("ventas_sem_4"));
        assertEquals(7.0, vector.get("promedio_4sem"));
        assertFalse(vector.containsKey("categoria_id"));
        assertEquals(7, vector.size());
        verify(arbolDemanda, never()).predecir(any());
        assertEquals(15.5, vector.get("stock_actual"));
        assertTrue(vector.containsKey("es_quincena"));
    }

    @Test
    void completaConCeroLasSemanasSinVentas() {
        prepararRecalculo(List.of(
                fila(SEMANA.minusWeeks(1), "0", false),
                fila(SEMANA.minusWeeks(4), "12", false)));
        when(arbolDemanda.proyectar(any())).thenReturn(5.0);
        when(arbolDemanda.getVersion()).thenReturn("1.1");

        servicio.recalcularPronosticos(EMPRESA_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Double>> captor = ArgumentCaptor.forClass(Map.class);
        verify(arbolDemanda).proyectar(captor.capture());
        Map<String, Double> vector = captor.getValue();

        assertEquals(0.0, vector.get("ventas_sem_2"));
        assertEquals(0.0, vector.get("ventas_sem_3"));
        assertEquals(12.0, vector.get("ventas_sem_4"));
        assertEquals(3.0, vector.get("promedio_4sem"));
    }

    @Test
    void guardaLaSemanaLaVersionDelModeloYDosDecimales() {
        prepararRecalculo(List.of(fila(SEMANA.minusWeeks(1), "4", false)));
        when(arbolDemanda.proyectar(any())).thenReturn(25.456);
        when(arbolDemanda.getVersion()).thenReturn("2.3");

        servicio.recalcularPronosticos(EMPRESA_ID);

        List<PronosticoDemanda> guardados = capturarGuardados();
        assertEquals(1, guardados.size());
        PronosticoDemanda guardado = guardados.get(0);
        assertEquals(SEMANA, guardado.getSemanaPronosticada());
        assertEquals("2.3", guardado.getVersionModelo());
        assertEquals(new BigDecimal("25.46"), guardado.getUnidadesProyectadas());
        assertTrue(guardado.isActive());
    }

    @Test
    void sinDatosSuficientesNoCalculaYDesactivaElPronosticoExistente() {
        prepararRecalculo(List.of(fila(SEMANA.minusWeeks(1), "4", true)), List.of(pronosticoExistente()));

        servicio.recalcularPronosticos(EMPRESA_ID);

        verify(arbolDemanda, never()).proyectar(any());
        List<PronosticoDemanda> guardados = capturarGuardados();
        assertEquals(1, guardados.size());
        assertFalse(guardados.get(0).isActive());
    }

    @Test
    void productoSinVentasEnLaVentanaNoRecibePronostico() {
        prepararRecalculo(List.of());

        servicio.recalcularPronosticos(EMPRESA_ID);

        verify(arbolDemanda, never()).proyectar(any());
        assertTrue(capturarGuardados().isEmpty());
    }

    @Test
    void consultarCalculaVentasDeLaSemanaPasadaYLaVariacion() {
        when(pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(pronosticoExistente()));
        when(facturaVentaService.obtenerHistorialSemanal(EMPRESA_ID, 2))
                .thenReturn(List.of(fila(SEMANA.minusWeeks(1), "40", false)));

        List<PronosticoDemandaResponse> respuesta = servicio.obtenerPronosticosPorEmpresa(EMPRESA_ID);

        assertEquals(1, respuesta.size());
        PronosticoDemandaResponse r = respuesta.get(0);
        assertEquals(PRODUCTO_ID, r.producto().id());
        assertEquals("Arroz Diana 500 g", r.producto().nombre());
        assertEquals("P-0012", r.producto().codigo());
        assertEquals(new BigDecimal("40"), r.ventasSemanaAnterior());
        assertEquals(new BigDecimal("25.0"), r.variacionPorcentual());
    }

    @Test
    void consultarDejaLaVariacionVaciaCuandoLaSemanaPasadaFueCero() {
        when(pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(pronosticoExistente()));
        when(facturaVentaService.obtenerHistorialSemanal(EMPRESA_ID, 2)).thenReturn(List.of());

        PronosticoDemandaResponse r = servicio.obtenerPronosticosPorEmpresa(EMPRESA_ID).get(0);

        assertEquals(BigDecimal.ZERO, r.ventasSemanaAnterior());
        assertNull(r.variacionPorcentual());
    }

    @Test
    void consultarSinPronosticosNoCargaElHistorial() {
        when(pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of());

        assertTrue(servicio.obtenerPronosticosPorEmpresa(EMPRESA_ID).isEmpty());
        verifyNoInteractions(facturaVentaService);
    }

    @Test
    void laSemanaConQuincenaSeDetectaDeLunesADomingo() {
        assertTrue(PronosticoServiceImpl.semanaIncluyeQuincena(LocalDate.of(2026, 10, 12)));
        assertFalse(PronosticoServiceImpl.semanaIncluyeQuincena(LocalDate.of(2026, 10, 19)));
        assertTrue(PronosticoServiceImpl.semanaIncluyeQuincena(LocalDate.of(2026, 10, 26)));
        assertFalse(PronosticoServiceImpl.semanaIncluyeQuincena(LocalDate.of(2026, 11, 2)));
        assertTrue(PronosticoServiceImpl.semanaIncluyeQuincena(LocalDate.of(2026, 11, 9)));
    }

    private void prepararRecalculo(List<VentaSemanalProductoResponse> historial) {
        prepararRecalculo(historial, List.of());
    }

    private void prepararRecalculo(List<VentaSemanalProductoResponse> historial, List<PronosticoDemanda> existentes) {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(EMPRESA_ID)));
        when(facturaVentaService.obtenerHistorialSemanal(EMPRESA_ID, 5)).thenReturn(historial);
        when(pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(existentes);
        when(productoRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(producto()));
    }

    @SuppressWarnings("unchecked")
    private List<PronosticoDemanda> capturarGuardados() {
        ArgumentCaptor<List<PronosticoDemanda>> captor = ArgumentCaptor.forClass(List.class);
        verify(pronosticoDemandaRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        empresa.setActive(true);
        return empresa;
    }

    private Producto producto() {
        Inventario inventario = new Inventario();
        inventario.setCantidadActual(new BigDecimal("15.5"));

        Producto producto = new Producto();
        producto.setId(PRODUCTO_ID);
        producto.setNombre("Arroz Diana 500 g");
        producto.setSku("P-0012");
        producto.setInventario(inventario);
        return producto;
    }

    private PronosticoDemanda pronosticoExistente() {
        PronosticoDemanda pronostico = new PronosticoDemanda();
        pronostico.setEmpresa(empresa(EMPRESA_ID));
        pronostico.setProducto(producto());
        pronostico.setSemanaPronosticada(SEMANA);
        pronostico.setUnidadesProyectadas(new BigDecimal("50.00"));
        pronostico.setVersionModelo("1.0");
        pronostico.setFechaCalculo(LocalDateTime.now());
        pronostico.setActive(true);
        return pronostico;
    }

    private VentaSemanalProductoResponse fila(LocalDate semanaInicio, String unidades, boolean sinDatos) {
        return new VentaSemanalProductoResponse(
                semanaInicio, semanaInicio.plusDays(6), PRODUCTO_ID, "Arroz Diana 500 g",
                new BigDecimal(unidades), BigDecimal.ZERO, sinDatos ? 5 : 12, sinDatos);
    }
}
