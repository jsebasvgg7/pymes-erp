package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.utils.mappers.CajaMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CajaServiceImplResumenTest {

    private static final Long EMPRESA_ID = 1L;

    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private CajaMapper cajaMapper;

    @InjectMocks private CajaServiceImpl service;

    private Empresa empresa(boolean activa) {
        Empresa empresa = new Empresa();
        empresa.setId(EMPRESA_ID);
        empresa.setActive(activa);
        return empresa;
    }

    private Caja caja(Long id, String nombre, String saldoInicial, String saldoActual) {
        Caja caja = new Caja();
        caja.setId(id);
        caja.setNombre(nombre);
        caja.setSaldoInicial(new BigDecimal(saldoInicial));
        caja.setSaldoActual(new BigDecimal(saldoActual));
        return caja;
    }

    private Object[] fila(Long cajaId, TipoMovimientoCaja tipo, String suma, long cantidad) {
        return new Object[] {cajaId, tipo, new BigDecimal(suma), cantidad};
    }

    @Test
    void calculaIngresosEgresosYMovimientosPorCaja() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(true)));
        Caja principal = caja(10L, "Principal", "100000.00", "150000.00");
        Caja secundaria = caja(11L, "Secundaria", "0.00", "0.00");
        when(cajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(principal, secundaria));
        when(movimientoCajaRepository.resumenPorCajaYTipo(List.of(10L, 11L))).thenReturn(List.of(
            fila(10L, TipoMovimientoCaja.INGRESO, "80000.00", 4L),
            fila(10L, TipoMovimientoCaja.EGRESO, "30000.00", 2L)
        ));

        List<CajaResumenResponse> resultado = service.obtenerResumenTodasCajas(EMPRESA_ID);

        assertEquals(2, resultado.size());
        CajaResumenResponse primera = resultado.get(0);
        assertEquals(10L, primera.cajaId());
        assertEquals("Principal", primera.cajaNombre());
        assertEquals(new BigDecimal("100000.00"), primera.saldoInicial());
        assertEquals(new BigDecimal("150000.00"), primera.saldoActual());
        assertEquals(new BigDecimal("80000.00"), primera.totalIngresos());
        assertEquals(new BigDecimal("30000.00"), primera.totalEgresos());
        assertEquals(6, primera.totalMovimientos());
    }

    @Test
    void cajaSinMovimientosQuedaEnCero() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(true)));
        Caja principal = caja(10L, "Principal", "0.00", "0.00");
        Caja secundaria = caja(11L, "Secundaria", "0.00", "0.00");
        when(cajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(principal, secundaria));
        when(movimientoCajaRepository.resumenPorCajaYTipo(List.of(10L, 11L))).thenReturn(List.of(
            fila(10L, TipoMovimientoCaja.INGRESO, "5000.00", 1L),
            fila(10L, TipoMovimientoCaja.EGRESO, "1000.00", 1L)
        ));

        CajaResumenResponse vacia = service.obtenerResumenTodasCajas(EMPRESA_ID).get(1);

        assertEquals(11L, vacia.cajaId());
        assertEquals(BigDecimal.ZERO, vacia.totalIngresos());
        assertEquals(BigDecimal.ZERO, vacia.totalEgresos());
        assertEquals(0, vacia.totalMovimientos());
    }

    @Test
    void cajaSoloConEgresosTieneIngresosEnCero() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(true)));
        when(cajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID))
            .thenReturn(List.of(caja(10L, "Principal", "0.00", "0.00")));
        when(movimientoCajaRepository.resumenPorCajaYTipo(List.of(10L))).thenReturn(List.<Object[]>of(
            fila(10L, TipoMovimientoCaja.EGRESO, "2500.00", 3L)
        ));

        CajaResumenResponse resumen = service.obtenerResumenTodasCajas(EMPRESA_ID).get(0);

        assertEquals(BigDecimal.ZERO, resumen.totalIngresos());
        assertEquals(new BigDecimal("2500.00"), resumen.totalEgresos());
        assertEquals(3, resumen.totalMovimientos());
    }

    @Test
    void usaUnaSolaConsultaAgrupadaParaTodasLasCajas() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(true)));
        when(cajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of(
            caja(10L, "Principal", "0.00", "0.00"),
            caja(11L, "Secundaria", "0.00", "0.00"),
            caja(12L, "Terciaria", "0.00", "0.00")
        ));
        when(movimientoCajaRepository.resumenPorCajaYTipo(List.of(10L, 11L, 12L))).thenReturn(List.of());

        service.obtenerResumenTodasCajas(EMPRESA_ID);

        verify(movimientoCajaRepository, times(1)).resumenPorCajaYTipo(any());
        verify(movimientoCajaRepository, never()).sumMontoByCajaAndTipo(any(), any());
        verify(movimientoCajaRepository, never()).countByCajaIdAndActiveTrue(any());
    }

    @Test
    void sinCajasDevuelveListaVaciaSinConsultarMovimientos() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(true)));
        when(cajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_ID)).thenReturn(List.of());

        List<CajaResumenResponse> resultado = service.obtenerResumenTodasCajas(EMPRESA_ID);

        assertTrue(resultado.isEmpty());
        verify(movimientoCajaRepository, never()).resumenPorCajaYTipo(any());
    }

    @Test
    void empresaInexistenteLanzaNoEncontrado() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.obtenerResumenTodasCajas(EMPRESA_ID));

        verify(cajaRepository, never()).findByEmpresaIdAndActiveTrue(any());
    }

    @Test
    void empresaInactivaLanzaNoEncontrado() {
        when(empresaRepository.findById(EMPRESA_ID)).thenReturn(Optional.of(empresa(false)));

        assertThrows(ResourceNotFoundException.class, () -> service.obtenerResumenTodasCajas(EMPRESA_ID));

        verify(cajaRepository, never()).findByEmpresaIdAndActiveTrue(any());
    }
}
