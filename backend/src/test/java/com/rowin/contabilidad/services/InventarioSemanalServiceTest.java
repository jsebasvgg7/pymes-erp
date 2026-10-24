package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.inventario.InventarioSemanalResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.InventarioSemanal;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.InventarioSemanalRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioSemanalServiceTest {

    private static final LocalDate LUNES = LocalDate.of(2026, 10, 19);
    private static final String EMAIL = "admin@vegashop.com";

    @Mock private InventarioRepository inventarioRepository;
    @Mock private InventarioSemanalRepository inventarioSemanalRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @Captor private ArgumentCaptor<List<InventarioSemanal>> captor;

    @InjectMocks private InventarioSemanalService service;

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        return empresa;
    }

    private Producto producto(Long id, String nombre) {
        Producto producto = new Producto();
        producto.setId(id);
        producto.setNombre(nombre);
        return producto;
    }

    private Inventario inventario(Empresa empresa, Producto producto, String cantidad, boolean activo) {
        Inventario inventario = new Inventario();
        inventario.setEmpresa(empresa);
        inventario.setProducto(producto);
        inventario.setCantidadActual(new BigDecimal(cantidad));
        inventario.setActive(activo);
        return inventario;
    }

    private Usuario usuario(Empresa empresa) {
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        return usuario;
    }

    @Test
    void noDuplicaLaFotoDeLaSemanaParaProductosYaRegistrados() {
        Empresa empresa = empresa(1L);
        when(inventarioRepository.findAll()).thenReturn(List.of(
            inventario(empresa, producto(1L, "Gaseosa"), "10", true),
            inventario(empresa, producto(2L, "Arroz"), "4.500", true)));
        when(inventarioSemanalRepository.findProductoIdsBySemanaInicio(LUNES)).thenReturn(List.of(1L));

        int nuevos = service.capturarSemana(LUNES);

        verify(inventarioSemanalRepository).saveAll(captor.capture());
        assertEquals(1, nuevos);
        assertEquals(1, captor.getValue().size());
        assertEquals(2L, captor.getValue().get(0).getProducto().getId());
    }

    @Test
    void siLaSemanaYaEstaCompletaNoGuardaNada() {
        Empresa empresa = empresa(1L);
        when(inventarioRepository.findAll()).thenReturn(List.of(
            inventario(empresa, producto(1L, "Gaseosa"), "10", true)));
        when(inventarioSemanalRepository.findProductoIdsBySemanaInicio(LUNES)).thenReturn(List.of(1L));

        int nuevos = service.capturarSemana(LUNES);

        verify(inventarioSemanalRepository).saveAll(captor.capture());
        assertEquals(0, nuevos);
        assertTrue(captor.getValue().isEmpty());
    }

    @Test
    void omiteLosInventariosInactivos() {
        Empresa empresa = empresa(1L);
        when(inventarioRepository.findAll()).thenReturn(List.of(
            inventario(empresa, producto(1L, "Gaseosa"), "10", false),
            inventario(empresa, producto(2L, "Arroz"), "3", true)));
        when(inventarioSemanalRepository.findProductoIdsBySemanaInicio(LUNES)).thenReturn(List.of());

        int nuevos = service.capturarSemana(LUNES);

        verify(inventarioSemanalRepository).saveAll(captor.capture());
        assertEquals(1, nuevos);
        assertEquals(2L, captor.getValue().get(0).getProducto().getId());
    }

    @Test
    void guardaEmpresaSemanaYCantidadActual() {
        Empresa empresa = empresa(7L);
        when(inventarioRepository.findAll()).thenReturn(List.of(
            inventario(empresa, producto(2L, "Arroz"), "4.500", true)));
        when(inventarioSemanalRepository.findProductoIdsBySemanaInicio(LUNES)).thenReturn(List.of());

        service.capturarSemana(LUNES);

        verify(inventarioSemanalRepository).saveAll(captor.capture());
        InventarioSemanal foto = captor.getValue().get(0);
        assertEquals(7L, foto.getEmpresa().getId());
        assertEquals(LUNES, foto.getSemanaInicio());
        assertEquals(new BigDecimal("4.500"), foto.getCantidad());
    }

    @Test
    void historialDeLaPropiaEmpresaSeDevuelve() {
        Empresa empresa = empresa(1L);
        InventarioSemanal foto = new InventarioSemanal();
        foto.setEmpresa(empresa);
        foto.setProducto(producto(2L, "Arroz"));
        foto.setSemanaInicio(LUNES);
        foto.setCantidad(new BigDecimal("4.500"));
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa)));
        when(inventarioSemanalRepository.findHistorial(eq(1L), any(LocalDate.class))).thenReturn(List.of(foto));

        List<InventarioSemanalResponse> res = service.historial(1L, 12, EMAIL);

        assertEquals(1, res.size());
        assertEquals("Arroz", res.get(0).producto());
        assertEquals(new BigDecimal("4.500"), res.get(0).cantidad());
    }

    @Test
    void historialDeOtraEmpresaEsRechazadoConForbidden() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa(1L))));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.historial(2L, 12, EMAIL));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(inventarioSemanalRepository, never()).findHistorial(any(), any());
    }

    @Test
    void historialConUsuarioInexistenteEsRechazadoConForbidden() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.historial(1L, 12, EMAIL));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(inventarioSemanalRepository, never()).findHistorial(any(), any());
    }

    @Test
    void historialConSemanasFueraDeRangoLanzaIllegalArgumentException() {
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuario(empresa(1L))));

        assertThrows(IllegalArgumentException.class, () -> service.historial(1L, 0, EMAIL));
        assertThrows(IllegalArgumentException.class, () -> service.historial(1L, 105, EMAIL));
    }
}
