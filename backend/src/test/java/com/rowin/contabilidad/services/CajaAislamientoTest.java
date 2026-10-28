package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CajaAislamientoTest {

    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;
    private static final Long CAJA_ID = 10L;
    private static final Long FORMA_PAGO_ID = 5L;

    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private AperturaCajaService aperturaCajaService;
    @Mock private CajaMapper cajaMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private CajaServiceImpl service;

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        return empresa;
    }

    private Caja cajaDeEmpresa(Long empresaId) {
        Caja caja = new Caja();
        caja.setId(CAJA_ID);
        caja.setEmpresa(empresa(empresaId));
        caja.setSaldoActual(new BigDecimal("1000.00"));
        return caja;
    }

    private FormaPago formaPagoDeEmpresa(Long empresaId) {
        FormaPago formaPago = new FormaPago();
        formaPago.setId(FORMA_PAGO_ID);
        formaPago.setEmpresa(empresa(empresaId));
        return formaPago;
    }

    private void cajaExiste(Caja caja) {
        when(cajaRepository.findById(CAJA_ID)).thenReturn(Optional.of(caja));
    }

    private void empresaAjenaRechazada() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private MovimientoCajaRequest movimiento(Long empresaId) {
        return new MovimientoCajaRequest(
            empresaId, CAJA_ID, FORMA_PAGO_ID, TipoMovimientoCaja.INGRESO,
            new BigDecimal("500.00"), "Ajuste", null, null);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class,
            () -> service.crear(new CajaCreateRequest(EMPRESA_AJENA, "Caja robada", BigDecimal.ZERO)));

        verifyNoInteractions(empresaRepository);
        verify(cajaRepository, never()).save(any());
    }

    @Test
    void listarMovimientosPorCajaRechazaUnaCajaAjena() {
        cajaExiste(cajaDeEmpresa(EMPRESA_AJENA));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class,
            () -> service.listarMovimientosPorCaja(CAJA_ID, Pageable.unpaged()));

        verifyNoInteractions(movimientoCajaRepository);
    }

    @Test
    void obtenerResumenCajaRechazaUnaCajaAjena() {
        cajaExiste(cajaDeEmpresa(EMPRESA_AJENA));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.obtenerResumenCaja(CAJA_ID));

        verifyNoInteractions(movimientoCajaRepository);
    }

    @Test
    void obtenerSaldoActualRechazaUnaCajaAjena() {
        cajaExiste(cajaDeEmpresa(EMPRESA_AJENA));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.obtenerSaldoActual(CAJA_ID));
    }

    @Test
    void obtenerSaldoActualPermiteUnaCajaPropia() {
        cajaExiste(cajaDeEmpresa(EMPRESA_PROPIA));

        assertEquals(new BigDecimal("1000.00"), service.obtenerSaldoActual(CAJA_ID));
        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
    }

    @Test
    void registrarMovimientoRechazaUnaEmpresaAjena() {
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.registrarMovimiento(movimiento(EMPRESA_AJENA)));

        verifyNoInteractions(empresaRepository, cajaRepository, movimientoCajaRepository, aperturaCajaService);
    }

    @Test
    void registrarMovimientoRechazaUnaCajaAjenaConEmpresaPropia() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        cajaExiste(cajaDeEmpresa(EMPRESA_AJENA));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.registrarMovimiento(movimiento(EMPRESA_PROPIA)));

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verifyNoInteractions(aperturaCajaService, movimientoCajaRepository);
        verify(cajaRepository, never()).save(any());
    }

    @Test
    void registrarMovimientoRechazaUnaFormaDePagoAjena() {
        Caja caja = cajaDeEmpresa(EMPRESA_PROPIA);
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        cajaExiste(caja);
        when(formaPagoRepository.findById(FORMA_PAGO_ID)).thenReturn(Optional.of(formaPagoDeEmpresa(EMPRESA_AJENA)));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.registrarMovimiento(movimiento(EMPRESA_PROPIA)));

        assertEquals(new BigDecimal("1000.00"), caja.getSaldoActual());
        verifyNoInteractions(movimientoCajaRepository);
        verify(cajaRepository, never()).save(any());
    }

    @Test
    void listarMovimientosFiltraPorLaEmpresaDelUsuario() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        when(empresaAccesoService.empresaIdActual()).thenReturn(EMPRESA_PROPIA);
        when(movimientoCajaRepository.findByEmpresaIdAndActiveTrue(EMPRESA_PROPIA, pageable)).thenReturn(org.springframework.data.domain.Page.empty());

        service.listarMovimientos(pageable);

        verify(movimientoCajaRepository).findByEmpresaIdAndActiveTrue(EMPRESA_PROPIA, pageable);
        verify(movimientoCajaRepository, never()).findByActiveTrue(pageable);
    }
}
