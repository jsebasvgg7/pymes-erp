package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.AperturaCajaRequest;
import com.rowin.contabilidad.dto.caja.AperturaCajaResponse;
import com.rowin.contabilidad.dto.caja.CierreCajaRequest;
import com.rowin.contabilidad.dto.caja.CierreCajaResponse;
import com.rowin.contabilidad.dto.caja.EstadoCajaResponse;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.EstadoAperturaCaja;
import com.rowin.contabilidad.entities.ResultadoCierreCaja;
import com.rowin.contabilidad.entities.TipoCierreCaja;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.AperturaCajaRepository;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AperturaCajaServiceTest {

    private static final String EMAIL = "admin@vegashop.com";
    private static final Long EMPRESA_ID = 1L;
    private static final Long CAJA_ID = 10L;

    @Mock private AperturaCajaRepository aperturaCajaRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private AperturaCajaService service;

    private Empresa empresa;
    private Usuario usuario;
    private Caja caja;

    @BeforeEach
    void setUp() {
        empresa = new Empresa();
        empresa.setId(EMPRESA_ID);

        usuario = new Usuario();
        usuario.setId(5L);
        usuario.setUsername("admin");
        usuario.setEmail(EMAIL);
        usuario.setEmpresa(empresa);

        caja = new Caja();
        caja.setId(CAJA_ID);
        caja.setNombre("Caja Principal");
        caja.setEmpresa(empresa);
    }

    private LocalDateTime ahoraBogota() {
        return LocalDateTime.now(AperturaCajaService.ZONA);
    }

    private LocalDateTime fechaVigente() {
        return AperturaCajaService.ultimoCorte(ahoraBogota()).plusSeconds(1);
    }

    private LocalDateTime fechaVencida() {
        return AperturaCajaService.ultimoCorte(ahoraBogota()).minusSeconds(1);
    }

    private AperturaCaja apertura(Long id, EstadoAperturaCaja estado, LocalDateTime fechaApertura, String inicial) {
        AperturaCaja apertura = new AperturaCaja();
        apertura.setId(id);
        apertura.setEmpresa(empresa);
        apertura.setCaja(caja);
        apertura.setEstado(estado);
        apertura.setUsuarioApertura(usuario);
        apertura.setFechaApertura(fechaApertura);
        apertura.setEfectivoInicial(new BigDecimal(inicial));
        return apertura;
    }

    private Object[] total(TipoFormaPago formaPago, TipoMovimientoCaja tipo, String suma) {
        return new Object[] {formaPago, tipo, new BigDecimal(suma)};
    }

    private List<Object[]> filas(Object[]... filas) {
        return Arrays.asList(filas);
    }

    private void stubUsuarioYCaja() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario));
        when(cajaRepository.findById(CAJA_ID)).thenReturn(Optional.of(caja));
    }

    private void stubGuardar() {
        when(aperturaCajaRepository.save(any(AperturaCaja.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private void stubCierre(AperturaCaja abierta, List<Object[]> totales) {
        stubUsuarioYCaja();
        stubGuardar();
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.of(abierta));
        when(movimientoCajaRepository.totalesPorApertura(abierta.getId())).thenReturn(totales);
    }

    private ResponseStatusException assertEstado(HttpStatus esperado, Runnable accion) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, accion::run);
        assertEquals(esperado.value(), ex.getStatusCode().value());
        return ex;
    }

    @Test
    void efectivoEsperadoSumaSoloEfectivoYReportaOtrosMediosAparte() {
        AperturaCaja abierta = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "50000.00");
        stubCierre(abierta, filas(
            total(TipoFormaPago.EFECTIVO, TipoMovimientoCaja.INGRESO, "100000.00"),
            total(TipoFormaPago.EFECTIVO, TipoMovimientoCaja.EGRESO, "20000.00"),
            total(TipoFormaPago.TRANSFERENCIA, TipoMovimientoCaja.INGRESO, "70000.00"),
            total(TipoFormaPago.TARJETA, TipoMovimientoCaja.EGRESO, "5000.00")
        ));

        CierreCajaResponse respuesta = service.cerrar(CAJA_ID, new CierreCajaRequest(new BigDecimal("130000")), EMAIL);

        assertEquals(0, new BigDecimal("130000.00").compareTo(respuesta.apertura().efectivoEsperado()));
        assertEquals(0, new BigDecimal("70000.00").compareTo(respuesta.ingresosOtrosMedios()));
        assertEquals(0, new BigDecimal("5000.00").compareTo(respuesta.egresosOtrosMedios()));
        assertEquals(ResultadoCierreCaja.CUADRADA, respuesta.apertura().resultado());
    }

    @Test
    void cierreConMenosEfectivoDelEsperadoEsFaltante() {
        AperturaCaja abierta = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "10000.00");
        stubCierre(abierta, filas(total(TipoFormaPago.EFECTIVO, TipoMovimientoCaja.INGRESO, "40000.00")));

        CierreCajaResponse respuesta = service.cerrar(CAJA_ID, new CierreCajaRequest(new BigDecimal("48000")), EMAIL);

        assertEquals(0, new BigDecimal("-2000.00").compareTo(respuesta.apertura().diferencia()));
        assertEquals(ResultadoCierreCaja.FALTANTE, respuesta.apertura().resultado());
    }

    @Test
    void cierreConMasEfectivoDelEsperadoEsSobrante() {
        AperturaCaja abierta = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "10000.00");
        stubCierre(abierta, filas(total(TipoFormaPago.EFECTIVO, TipoMovimientoCaja.INGRESO, "40000.00")));

        CierreCajaResponse respuesta = service.cerrar(CAJA_ID, new CierreCajaRequest(new BigDecimal("51500")), EMAIL);

        assertEquals(0, new BigDecimal("1500.00").compareTo(respuesta.apertura().diferencia()));
        assertEquals(ResultadoCierreCaja.SOBRANTE, respuesta.apertura().resultado());
    }

    @Test
    void cierreManualGuardaEstadoUsuarioYTipo() {
        AperturaCaja abierta = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "0.00");
        stubCierre(abierta, List.of());

        CierreCajaResponse respuesta = service.cerrar(CAJA_ID, new CierreCajaRequest(BigDecimal.ZERO), EMAIL);

        assertEquals(EstadoAperturaCaja.CERRADA, abierta.getEstado());
        assertEquals(TipoCierreCaja.MANUAL, abierta.getTipoCierre());
        assertSame(usuario, abierta.getUsuarioCierre());
        assertEquals(5L, respuesta.apertura().usuarioCierreId());
        assertTrue(abierta.getFechaCierre() != null);
    }

    @Test
    void noSePuedeCerrarUnaCajaQueNoEstaAbierta() {
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.empty());

        assertEstado(HttpStatus.CONFLICT, () -> service.cerrar(CAJA_ID, new CierreCajaRequest(BigDecimal.TEN), EMAIL));

        verify(aperturaCajaRepository, never()).save(any(AperturaCaja.class));
    }

    @Test
    void abrirGuardaAperturaAbiertaConEfectivoInicial() {
        stubUsuarioYCaja();
        stubGuardar();
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.empty());

        AperturaCajaResponse respuesta = service.abrir(CAJA_ID, new AperturaCajaRequest(new BigDecimal("25000")), EMAIL);

        ArgumentCaptor<AperturaCaja> captor = ArgumentCaptor.forClass(AperturaCaja.class);
        verify(aperturaCajaRepository).save(captor.capture());
        assertEquals(EstadoAperturaCaja.ABIERTA, captor.getValue().getEstado());
        assertEquals(0, new BigDecimal("25000.00").compareTo(captor.getValue().getEfectivoInicial()));
        assertSame(usuario, captor.getValue().getUsuarioApertura());
        assertSame(caja, captor.getValue().getCaja());
        assertNull(respuesta.efectivoEsperado());
        assertNull(respuesta.efectivoContado());
        assertFalse(respuesta.requiereCierre());
    }

    @Test
    void noSePuedenTenerDosAperturasAbiertasEnLaMismaCaja() {
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.of(apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "0.00")));

        assertEstado(HttpStatus.CONFLICT, () -> service.abrir(CAJA_ID, new AperturaCajaRequest(BigDecimal.ZERO), EMAIL));

        verify(aperturaCajaRepository, never()).save(any(AperturaCaja.class));
    }

    @Test
    void abrirUnaCajaDeOtraEmpresaEsProhibido() {
        Empresa otra = new Empresa();
        otra.setId(99L);
        caja.setEmpresa(otra);
        stubUsuarioYCaja();

        assertEstado(HttpStatus.FORBIDDEN, () -> service.abrir(CAJA_ID, new AperturaCajaRequest(BigDecimal.ZERO), EMAIL));

        verify(aperturaCajaRepository, never()).save(any(AperturaCaja.class));
    }

    @Test
    void usuarioInexistenteEsProhibido() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        assertEstado(HttpStatus.FORBIDDEN, () -> service.estado(CAJA_ID, EMAIL));
    }

    @Test
    void ventaConCajaCerradaSeRechazaConConflicto() {
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.empty());

        ResponseStatusException ex = assertEstado(HttpStatus.CONFLICT, () -> service.exigirAperturaDeCaja(CAJA_ID));

        assertEquals(AperturaCajaService.MENSAJE_CERRADA, ex.getReason());
    }

    @Test
    void aperturaDeUnDiaAnteriorExigeCerrarla() {
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.of(apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVencida(), "0.00")));

        ResponseStatusException ex = assertEstado(HttpStatus.CONFLICT, () -> service.exigirAperturaDeCaja(CAJA_ID));

        assertEquals(AperturaCajaService.MENSAJE_VENCIDA, ex.getReason());
    }

    @Test
    void aperturaVigenteSeAceptaParaOperar() {
        AperturaCaja vigente = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "0.00");
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.of(vigente));

        assertSame(vigente, service.exigirAperturaDeCaja(CAJA_ID));
    }

    @Test
    void sinNingunaCajaAbiertaLaEmpresaNoPuedeOperar() {
        when(aperturaCajaRepository.findPorEmpresaYEstado(EMPRESA_ID, EstadoAperturaCaja.ABIERTA)).thenReturn(List.of());

        ResponseStatusException ex = assertEstado(HttpStatus.CONFLICT, () -> service.exigirAperturaDeEmpresa(EMPRESA_ID));

        assertEquals(AperturaCajaService.MENSAJE_CERRADA, ex.getReason());
    }

    @Test
    void laEmpresaUsaLaPrimeraCajaAbiertaVigente() {
        AperturaCaja vencida = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVencida(), "0.00");
        AperturaCaja vigente = apertura(101L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "0.00");
        when(aperturaCajaRepository.findPorEmpresaYEstado(EMPRESA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(List.of(vencida, vigente));

        assertSame(vigente, service.exigirAperturaDeEmpresa(EMPRESA_ID));
    }

    @Test
    void siTodasLasAbiertasSonDeDiasAnterioresLaEmpresaDebeCerrarlas() {
        AperturaCaja vencida = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVencida(), "0.00");
        when(aperturaCajaRepository.findPorEmpresaYEstado(EMPRESA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(List.of(vencida));

        ResponseStatusException ex = assertEstado(HttpStatus.CONFLICT, () -> service.exigirAperturaDeEmpresa(EMPRESA_ID));

        assertEquals(AperturaCajaService.MENSAJE_VENCIDA, ex.getReason());
    }

    @Test
    void reabrirLimpiaElConteoYLaDiferenciaDelCierre() {
        AperturaCaja cerrada = apertura(100L, EstadoAperturaCaja.CERRADA, fechaVigente(), "10000.00");
        cerrada.setFechaCierre(ahoraBogota());
        cerrada.setUsuarioCierre(usuario);
        cerrada.setEfectivoEsperado(new BigDecimal("50000.00"));
        cerrada.setEfectivoContado(new BigDecimal("49000.00"));
        cerrada.setDiferencia(new BigDecimal("-1000.00"));
        cerrada.setTipoCierre(TipoCierreCaja.MANUAL);
        stubUsuarioYCaja();
        stubGuardar();
        when(aperturaCajaRepository.findFirstByCajaIdOrderByIdDesc(CAJA_ID)).thenReturn(Optional.of(cerrada));

        AperturaCajaResponse respuesta = service.reabrir(CAJA_ID, EMAIL);

        assertEquals(EstadoAperturaCaja.ABIERTA, cerrada.getEstado());
        assertNull(cerrada.getFechaCierre());
        assertNull(cerrada.getUsuarioCierre());
        assertNull(cerrada.getEfectivoEsperado());
        assertNull(cerrada.getEfectivoContado());
        assertNull(cerrada.getDiferencia());
        assertNull(cerrada.getTipoCierre());
        assertNull(respuesta.resultado());
    }

    @Test
    void noSeReabreSiYaHayOtraAperturaDespuesDelCierre() {
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdOrderByIdDesc(CAJA_ID))
            .thenReturn(Optional.of(apertura(101L, EstadoAperturaCaja.ABIERTA, fechaVigente(), "0.00")));

        assertEstado(HttpStatus.CONFLICT, () -> service.reabrir(CAJA_ID, EMAIL));

        verify(aperturaCajaRepository, never()).save(any(AperturaCaja.class));
    }

    @Test
    void noSeReabreUnCierreDeUnDiaAnterior() {
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdOrderByIdDesc(CAJA_ID))
            .thenReturn(Optional.of(apertura(100L, EstadoAperturaCaja.CERRADA, fechaVencida(), "0.00")));

        assertEstado(HttpStatus.CONFLICT, () -> service.reabrir(CAJA_ID, EMAIL));

        verify(aperturaCajaRepository, never()).save(any(AperturaCaja.class));
    }

    @Test
    void noSeReabreUnaCajaSinCierres() {
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdOrderByIdDesc(CAJA_ID)).thenReturn(Optional.empty());

        assertEstado(HttpStatus.CONFLICT, () -> service.reabrir(CAJA_ID, EMAIL));
    }

    @Test
    void cierreAutomaticoNoPideConteoYQuedaMarcadoComoAutomatico() {
        AperturaCaja abierta = apertura(100L, EstadoAperturaCaja.ABIERTA, fechaVencida(), "20000.00");
        stubGuardar();
        when(aperturaCajaRepository.findByEstado(EstadoAperturaCaja.ABIERTA)).thenReturn(List.of(abierta));
        when(movimientoCajaRepository.totalesPorApertura(100L)).thenReturn(filas(
            total(TipoFormaPago.EFECTIVO, TipoMovimientoCaja.INGRESO, "30000.00")
        ));

        service.cerrarAutomaticamente();

        assertEquals(EstadoAperturaCaja.CERRADA, abierta.getEstado());
        assertEquals(TipoCierreCaja.AUTOMATICO, abierta.getTipoCierre());
        assertEquals(0, new BigDecimal("50000.00").compareTo(abierta.getEfectivoEsperado()));
        assertNull(abierta.getEfectivoContado());
        assertNull(abierta.getDiferencia());
        assertNull(abierta.getUsuarioCierre());
    }

    @Test
    void historialDeOtraEmpresaEsProhibido() {
        Empresa otra = new Empresa();
        otra.setId(99L);
        caja.setEmpresa(otra);
        stubUsuarioYCaja();

        assertEstado(HttpStatus.FORBIDDEN, () -> service.historial(CAJA_ID, PageRequest.of(0, 10), EMAIL));
    }

    @Test
    void historialDevuelveLosCierresDeLaCaja() {
        AperturaCaja cerrada = apertura(100L, EstadoAperturaCaja.CERRADA, fechaVigente(), "0.00");
        cerrada.setDiferencia(new BigDecimal("-500.00"));
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findByCajaIdAndEstadoOrderByFechaCierreDesc(
            CAJA_ID, EstadoAperturaCaja.CERRADA, PageRequest.of(0, 10)))
            .thenReturn(new PageImpl<>(List.of(cerrada)));

        Page<AperturaCajaResponse> pagina = service.historial(CAJA_ID, PageRequest.of(0, 10), EMAIL);

        assertEquals(1, pagina.getTotalElements());
        assertEquals(ResultadoCierreCaja.FALTANTE, pagina.getContent().get(0).resultado());
    }

    @Test
    void estadoMarcaRequiereCierreYSugiereElUltimoConteo() {
        AperturaCaja vencida = apertura(101L, EstadoAperturaCaja.ABIERTA, fechaVencida(), "0.00");
        AperturaCaja anterior = apertura(100L, EstadoAperturaCaja.CERRADA, fechaVencida(), "0.00");
        anterior.setEfectivoContado(new BigDecimal("75000.00"));
        stubUsuarioYCaja();
        when(aperturaCajaRepository.findFirstByCajaIdAndEstado(CAJA_ID, EstadoAperturaCaja.ABIERTA))
            .thenReturn(Optional.of(vencida));
        when(aperturaCajaRepository.findFirstByCajaIdAndEstadoOrderByFechaCierreDesc(CAJA_ID, EstadoAperturaCaja.CERRADA))
            .thenReturn(Optional.of(anterior));

        EstadoCajaResponse estado = service.estado(CAJA_ID, EMAIL);

        assertTrue(estado.abierta());
        assertTrue(estado.requiereCierre());
        assertEquals(0, new BigDecimal("75000.00").compareTo(estado.efectivoSugerido()));
        assertNull(estado.apertura().efectivoEsperado());
    }

    @Test
    void estadosDeOtraEmpresaEsProhibido() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario));

        assertEstado(HttpStatus.FORBIDDEN, () -> service.estados(99L, EMAIL));
    }

    @Test
    void aperturaInicialDelRegistroArrancaConEfectivoCero() {
        stubGuardar();

        AperturaCaja apertura = service.abrirInicial(caja, usuario);

        assertEquals(EstadoAperturaCaja.ABIERTA, apertura.getEstado());
        assertEquals(0, BigDecimal.ZERO.compareTo(apertura.getEfectivoInicial()));
        assertSame(caja, apertura.getCaja());
        assertSame(usuario, apertura.getUsuarioApertura());
    }

    @Test
    void elCorteDelDiaOperativoEsALas4DeLaMadrugada() {
        assertEquals(
            LocalDateTime.of(2026, 10, 23, 4, 0),
            AperturaCajaService.ultimoCorte(LocalDateTime.of(2026, 10, 24, 3, 59))
        );
        assertEquals(
            LocalDateTime.of(2026, 10, 24, 4, 0),
            AperturaCajaService.ultimoCorte(LocalDateTime.of(2026, 10, 24, 4, 0))
        );
        assertEquals(
            LocalDateTime.of(2026, 10, 24, 4, 0),
            AperturaCajaService.ultimoCorte(LocalDateTime.of(2026, 10, 24, 23, 30))
        );
    }
}