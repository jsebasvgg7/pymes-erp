package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.inventario.AjusteStockRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.TipoMovimientoInventario;
import com.rowin.contabilidad.entities.UnidadMedida;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.MovimientoInventarioRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.utils.mappers.MovimientoInventarioMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioAislamientoTest {

    private static final Long PRODUCTO_ID = 60L;
    private static final Long USUARIO_ID = 80L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private InventarioRepository inventarioRepository;
    @Mock private MovimientoInventarioRepository movimientoInventarioRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MovimientoInventarioMapper movimientoInventarioMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private InventarioServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        return empresa;
    }

    private Producto productoDeEmpresa(Long empresaId) {
        Producto producto = new Producto();
        producto.setId(PRODUCTO_ID);
        producto.setEmpresa(empresa(empresaId));
        producto.setNombre("Producto");
        producto.setSku("SKU-1");
        producto.setUnidadMedida(UnidadMedida.UNIDAD);
        producto.setStockMinimo(BigDecimal.ONE);
        producto.setPrecioVenta(BigDecimal.TEN);
        return producto;
    }

    private Usuario usuarioDeEmpresa(Long empresaId) {
        Usuario usuario = new Usuario();
        usuario.setId(USUARIO_ID);
        usuario.setEmpresa(empresa(empresaId));
        return usuario;
    }

    private AjusteStockRequest ajuste(Long empresaId, Long usuarioId) {
        return new AjusteStockRequest(
            empresaId, PRODUCTO_ID, usuarioId, TipoMovimientoInventario.ENTRADA,
            new BigDecimal("5"), "Motivo", null);
    }

    private void productoActivoExiste(Producto producto) {
        when(productoRepository.findById(PRODUCTO_ID)).thenReturn(Optional.of(producto));
    }

    private void inventarioNoSeModifica() {
        verify(inventarioRepository, never()).save(any());
        verify(movimientoInventarioRepository, never()).save(any());
    }

    @Test
    void obtenerPorProductoPermiteUnProductoPropio() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_PROPIA));
        Inventario inventario = new Inventario();
        inventario.setCantidadActual(new BigDecimal("10"));
        inventario.setCostoPromedio(new BigDecimal("5"));
        when(inventarioRepository.findByProductoIdAndActiveTrue(PRODUCTO_ID)).thenReturn(Optional.of(inventario));

        service.obtenerPorProducto(PRODUCTO_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
    }

    @Test
    void obtenerPorProductoRechazaUnProductoAjeno() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorProducto(PRODUCTO_ID));

        verifyNoInteractions(inventarioRepository);
    }

    @Test
    void obtenerMovimientosPorProductoRechazaUnProductoAjeno() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerMovimientosPorProducto(PRODUCTO_ID));

        verifyNoInteractions(movimientoInventarioRepository, movimientoInventarioMapper);
    }

    @Test
    void ajustarStockRechazaUnaEmpresaAjena() {
        assertThrows(ResponseStatusException.class, () -> service.ajustarStock(ajuste(EMPRESA_AJENA, null)));

        verifyNoInteractions(empresaRepository, productoRepository, usuarioRepository);
        inventarioNoSeModifica();
    }

    @Test
    void ajustarStockRechazaUnProductoDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        productoActivoExiste(productoDeEmpresa(EMPRESA_AJENA));

        assertThrows(IllegalArgumentException.class, () -> service.ajustarStock(ajuste(EMPRESA_PROPIA, null)));

        verifyNoInteractions(usuarioRepository);
        inventarioNoSeModifica();
    }

    @Test
    void ajustarStockRechazaUnUsuarioDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        productoActivoExiste(productoDeEmpresa(EMPRESA_PROPIA));
        Inventario inventario = new Inventario();
        inventario.setCantidadActual(new BigDecimal("10"));
        when(inventarioRepository.findByProductoIdAndActiveTrue(PRODUCTO_ID)).thenReturn(Optional.of(inventario));
        when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuarioDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class, () -> service.ajustarStock(ajuste(EMPRESA_PROPIA, USUARIO_ID)));

        inventarioNoSeModifica();
    }
}
