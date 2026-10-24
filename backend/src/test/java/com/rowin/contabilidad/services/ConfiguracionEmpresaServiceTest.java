package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaResponse;
import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaUpdateRequest;
import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfiguracionEmpresaServiceTest {

    private static final String EMAIL = "admin@vegashop.com";

    @Mock private ConfiguracionEmpresaRepository configuracionEmpresaRepository;
    @Mock private ConfiguracionEmpresaSeeder configuracionEmpresaSeeder;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private ConfiguracionEmpresaService service;

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        return empresa;
    }

    private Usuario usuario(Empresa empresa) {
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        return usuario;
    }

    private ConfiguracionEmpresa configuracion(Empresa empresa) {
        ConfiguracionEmpresa configuracion = new ConfiguracionEmpresa();
        configuracion.setEmpresa(empresa);
        return configuracion;
    }

    private ConfiguracionEmpresaUpdateRequest vacio() {
        return new ConfiguracionEmpresaUpdateRequest(null, null, null, null, null, null, null, null, null, null, null, null);
    }

    private ConfiguracionEmpresaUpdateRequest conDias(Integer dias) {
        return new ConfiguracionEmpresaUpdateRequest(null, null, null, null, dias, null, null, null, null, null, null, null);
    }

    private ConfiguracionEmpresaUpdateRequest conAncho(Integer ancho) {
        return new ConfiguracionEmpresaUpdateRequest(null, null, null, null, null, null, null, null, null, ancho, null, null);
    }

    private ConfiguracionEmpresaUpdateRequest conMoneda(String moneda, String simbolo, String formatoFecha) {
        return new ConfiguracionEmpresaUpdateRequest(moneda, simbolo, formatoFecha, null, null, null, null, null, null, null, null, null);
    }

    private ConfiguracionEmpresaUpdateRequest conRecibo(String nombre, String pie) {
        return new ConfiguracionEmpresaUpdateRequest(null, null, null, null, null, null, null, null, null, null, nombre, pie);
    }

    @Test
    void newConfigurationHasExpectedDefaults() {
        ConfiguracionEmpresa configuracion = new ConfiguracionEmpresa();

        assertEquals("COP", configuracion.getMoneda());
        assertEquals("$", configuracion.getSimboloMoneda());
        assertEquals("DD/MM/AAAA", configuracion.getFormatoFecha());
        assertFalse(configuracion.isClienteObligatorio());
        assertNull(configuracion.getDiasVencimientoCredito());
        assertFalse(configuracion.isCodigoBarrasActivo());
        assertEquals(BigDecimal.ZERO, configuracion.getStockMinimoDefecto());
        assertTrue(configuracion.isAvisarStockBajo());
        assertEquals(LocalTime.of(4, 0), configuracion.getHoraCierreAutomatico());
        assertEquals(58, configuracion.getAnchoRecibo());
        assertNull(configuracion.getNombreRecibo());
        assertNull(configuracion.getMensajePieRecibo());
    }

    @Test
    void obtenerReturnsOwnConfiguration() {
        Empresa empresa = empresa(1L);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(empresa)));

        ConfiguracionEmpresaResponse response = service.obtener(1L, EMAIL);

        assertEquals(1L, response.empresaId());
        assertEquals("COP", response.moneda());
        assertEquals("04:00", response.horaCierreAutomatico());
        verify(configuracionEmpresaSeeder, never()).sembrar(any());
    }

    @Test
    void obtenerCreatesDefaultRowWhenMissing() {
        Empresa empresa = empresa(1L);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.empty());
        when(configuracionEmpresaSeeder.sembrar(empresa)).thenReturn(configuracion(empresa));

        ConfiguracionEmpresaResponse response = service.obtener(1L, EMAIL);

        assertEquals("COP", response.moneda());
        verify(configuracionEmpresaSeeder).sembrar(empresa);
    }

    @Test
    void obtenerRejectsAnotherCompany() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa(1L))));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.obtener(2L, EMAIL));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(configuracionEmpresaRepository, never()).findByEmpresaId(any());
    }

    @Test
    void obtenerRejectsUnknownUser() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.obtener(1L, EMAIL));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void actualizarRejectsAnotherCompany() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa(1L))));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class, () -> service.actualizar(2L, vacio(), EMAIL));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(configuracionEmpresaRepository, never()).save(any());
    }

    @Test
    void actualizarChangesOnlyProvidedFields() {
        Empresa empresa = empresa(1L);
        ConfiguracionEmpresa configuracion = configuracion(empresa);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion));
        when(configuracionEmpresaRepository.save(configuracion)).thenReturn(configuracion);

        ConfiguracionEmpresaResponse response = service.actualizar(1L, conMoneda("USD", "US$", "AAAA-MM-DD"), EMAIL);

        assertEquals("USD", response.moneda());
        assertEquals("US$", response.simboloMoneda());
        assertEquals("AAAA-MM-DD", response.formatoFecha());
        assertNull(response.diasVencimientoCredito());
        assertEquals(58, response.anchoRecibo());
    }

    @Test
    void actualizarStoresCreditDays() {
        Empresa empresa = empresa(1L);
        ConfiguracionEmpresa configuracion = configuracion(empresa);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion));
        when(configuracionEmpresaRepository.save(configuracion)).thenReturn(configuracion);

        ConfiguracionEmpresaResponse response = service.actualizar(1L, conDias(45), EMAIL);

        assertEquals(45, response.diasVencimientoCredito());
    }

    @Test
    void actualizarWithZeroRemovesCreditLimit() {
        Empresa empresa = empresa(1L);
        ConfiguracionEmpresa configuracion = configuracion(empresa);
        configuracion.setDiasVencimientoCredito(45);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion));
        when(configuracionEmpresaRepository.save(configuracion)).thenReturn(configuracion);

        ConfiguracionEmpresaResponse response = service.actualizar(1L, conDias(0), EMAIL);

        assertNull(response.diasVencimientoCredito());
    }

    @Test
    void actualizarRejectsInvalidReceiptWidth() {
        Empresa empresa = empresa(1L);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(empresa)));

        assertThrows(IllegalArgumentException.class, () -> service.actualizar(1L, conAncho(70), EMAIL));

        verify(configuracionEmpresaRepository, never()).save(any());
    }

    @Test
    void actualizarAcceptsEightyMillimeterReceipt() {
        Empresa empresa = empresa(1L);
        ConfiguracionEmpresa configuracion = configuracion(empresa);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion));
        when(configuracionEmpresaRepository.save(configuracion)).thenReturn(configuracion);

        assertEquals(80, service.actualizar(1L, conAncho(80), EMAIL).anchoRecibo());
    }

    @Test
    void actualizarClearsReceiptTextsWhenBlank() {
        Empresa empresa = empresa(1L);
        ConfiguracionEmpresa configuracion = configuracion(empresa);
        configuracion.setNombreRecibo("Vega Shop");
        configuracion.setMensajePieRecibo("Gracias por su compra");
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion));
        when(configuracionEmpresaRepository.save(configuracion)).thenReturn(configuracion);

        ConfiguracionEmpresaResponse response = service.actualizar(1L, conRecibo("  ", ""), EMAIL);

        assertNull(response.nombreRecibo());
        assertNull(response.mensajePieRecibo());
    }
}
