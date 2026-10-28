package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.producto.ProductoCreateRequest;
import com.rowin.contabilidad.dto.producto.ProductoUpdateRequest;
import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Impuesto;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.UnidadMedida;
import com.rowin.contabilidad.repositories.CategoriaProductoRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ImpuestoRepository;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.utils.mappers.ProductoMapper;
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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoAislamientoTest {

    private static final Long PRODUCTO_ID = 60L;
    private static final Long CATEGORIA_ID = 90L;
    private static final Long IMPUESTO_ID = 70L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private ProductoRepository productoRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private CategoriaProductoRepository categoriaProductoRepository;
    @Mock private InventarioRepository inventarioRepository;
    @Mock private ImpuestoRepository impuestoRepository;
    @Mock private ProductoMapper productoMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private ProductoServiceImpl service;

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
        return producto;
    }

    private CategoriaProducto categoriaDeEmpresa(Long empresaId) {
        CategoriaProducto categoria = new CategoriaProducto();
        categoria.setId(CATEGORIA_ID);
        categoria.setEmpresa(empresa(empresaId));
        return categoria;
    }

    private Impuesto impuestoDeEmpresa(Long empresaId) {
        Impuesto impuesto = new Impuesto();
        impuesto.setId(IMPUESTO_ID);
        impuesto.setEmpresa(empresa(empresaId));
        return impuesto;
    }

    private void productoActivoExiste(Producto producto) {
        when(productoRepository.findByIdAndActiveTrue(PRODUCTO_ID)).thenReturn(Optional.of(producto));
    }

    private ProductoCreateRequest solicitudCrear(Long empresaId, Long categoriaId, Set<Long> impuestoIds) {
        return new ProductoCreateRequest(
            empresaId, categoriaId, null, "Producto", null, UnidadMedida.UNIDAD,
            BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.TEN, impuestoIds);
    }

    private ProductoUpdateRequest solicitudActualizar(Long categoriaId, Set<Long> impuestoIds) {
        return new ProductoUpdateRequest(
            "Producto", null, null, categoriaId, null, null, null, impuestoIds);
    }

    private void nadaSeGuardo() {
        verify(productoRepository, never()).save(any());
        verify(inventarioRepository, never()).save(any());
    }

    @Test
    void obtenerPorIdPermiteUnProductoPropio() {
        Producto producto = productoDeEmpresa(EMPRESA_PROPIA);
        productoActivoExiste(producto);

        service.obtenerPorId(PRODUCTO_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(productoMapper).toResponse(producto);
    }

    @Test
    void obtenerPorIdRechazaUnProductoAjeno() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(PRODUCTO_ID));

        verifyNoInteractions(productoMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        assertThrows(ResponseStatusException.class,
            () -> service.crear(solicitudCrear(EMPRESA_AJENA, null, null)));

        verifyNoInteractions(empresaRepository, categoriaProductoRepository, impuestoRepository);
        nadaSeGuardo();
    }

    @Test
    void crearRechazaUnaCategoriaDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(categoriaProductoRepository.findById(CATEGORIA_ID))
            .thenReturn(Optional.of(categoriaDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudCrear(EMPRESA_PROPIA, CATEGORIA_ID, null)));

        verifyNoInteractions(impuestoRepository);
        nadaSeGuardo();
    }

    @Test
    void crearRechazaUnImpuestoDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(productoMapper.toEntity(any(ProductoCreateRequest.class), any(), any())).thenReturn(new Producto());
        when(impuestoRepository.findById(IMPUESTO_ID)).thenReturn(Optional.of(impuestoDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudCrear(EMPRESA_PROPIA, null, Set.of(IMPUESTO_ID))));

        nadaSeGuardo();
    }

    @Test
    void actualizarRechazaUnProductoAjeno() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(PRODUCTO_ID, solicitudActualizar(null, null)));

        verifyNoInteractions(productoMapper, categoriaProductoRepository, impuestoRepository);
        nadaSeGuardo();
    }

    @Test
    void actualizarRechazaUnaCategoriaDeOtraEmpresa() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_PROPIA));
        when(categoriaProductoRepository.findById(CATEGORIA_ID))
            .thenReturn(Optional.of(categoriaDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.actualizar(PRODUCTO_ID, solicitudActualizar(CATEGORIA_ID, null)));

        verifyNoInteractions(impuestoRepository);
        nadaSeGuardo();
    }

    @Test
    void actualizarRechazaUnImpuestoDeOtraEmpresa() {
        productoActivoExiste(productoDeEmpresa(EMPRESA_PROPIA));
        when(impuestoRepository.findById(IMPUESTO_ID)).thenReturn(Optional.of(impuestoDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.actualizar(PRODUCTO_ID, solicitudActualizar(null, Set.of(IMPUESTO_ID))));

        nadaSeGuardo();
    }

    @Test
    void eliminarRechazaUnProductoAjeno() {
        Producto producto = productoDeEmpresa(EMPRESA_AJENA);
        productoActivoExiste(producto);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(PRODUCTO_ID));

        assertTrue(producto.isActive());
        verifyNoInteractions(inventarioRepository);
        nadaSeGuardo();
    }
}
