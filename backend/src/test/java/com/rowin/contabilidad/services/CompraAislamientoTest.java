package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.compra.CompraCreateRequest;
import com.rowin.contabilidad.dto.compra.CompraUpdateRequest;
import com.rowin.contabilidad.dto.detallecompra.DetalleCompraRequest;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Compra;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.Impuesto;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.Proveedor;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.CompraRepository;
import com.rowin.contabilidad.repositories.DetalleCompraRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.ImpuestoRepository;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.ProveedorRepository;
import com.rowin.contabilidad.utils.mappers.CompraMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
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
class CompraAislamientoTest {

    private static final Long COMPRA_ID = 30L;
    private static final Long PROVEEDOR_ID = 40L;
    private static final Long FORMA_PAGO_ID = 50L;
    private static final Long PRODUCTO_ID = 60L;
    private static final Long IMPUESTO_ID = 70L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private CompraRepository compraRepository;
    @Mock private DetalleCompraRepository detalleCompraRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private InventarioRepository inventarioRepository;
    @Mock private ImpuestoRepository impuestoRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private CompraMapper compraMapper;
    @Mock private AperturaCajaService aperturaCajaService;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private CompraServiceImpl service;

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

    private Compra compraDeEmpresa(Long empresaId) {
        Compra compra = new Compra();
        compra.setId(COMPRA_ID);
        compra.setEmpresa(empresa(empresaId));
        return compra;
    }

    private void compraActivaExiste(Compra compra) {
        when(compraRepository.findByIdAndActiveTrue(COMPRA_ID)).thenReturn(Optional.of(compra));
    }

    private Proveedor proveedorDeEmpresa(Long empresaId) {
        Proveedor proveedor = new Proveedor();
        proveedor.setId(PROVEEDOR_ID);
        proveedor.setEmpresa(empresa(empresaId));
        return proveedor;
    }

    private FormaPago formaPagoDeEmpresa(Long empresaId) {
        FormaPago formaPago = new FormaPago();
        formaPago.setId(FORMA_PAGO_ID);
        formaPago.setEmpresa(empresa(empresaId));
        formaPago.setTipo(TipoFormaPago.EFECTIVO);
        return formaPago;
    }

    private Producto productoDeEmpresa(Long empresaId) {
        Producto producto = new Producto();
        producto.setId(PRODUCTO_ID);
        producto.setEmpresa(empresa(empresaId));
        return producto;
    }

    private Impuesto impuestoDeEmpresa(Long empresaId) {
        Impuesto impuesto = new Impuesto();
        impuesto.setId(IMPUESTO_ID);
        impuesto.setEmpresa(empresa(empresaId));
        impuesto.setPorcentaje(new BigDecimal("19"));
        return impuesto;
    }

    private CompraCreateRequest solicitudConDetalle(Long productoId, Set<Long> impuestoIds) {
        DetalleCompraRequest detalle = new DetalleCompraRequest(
            productoId, "Detalle", new BigDecimal("2"), new BigDecimal("3"), impuestoIds);
        return new CompraCreateRequest(
            EMPRESA_PROPIA, PROVEEDOR_ID, FORMA_PAGO_ID, null, null, List.of(detalle));
    }

    private void referenciasPropiasExisten() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(proveedorRepository.findById(PROVEEDOR_ID)).thenReturn(Optional.of(proveedorDeEmpresa(EMPRESA_PROPIA)));
        when(formaPagoRepository.findById(FORMA_PAGO_ID)).thenReturn(Optional.of(formaPagoDeEmpresa(EMPRESA_PROPIA)));
    }

    private void aperturaAbiertaExiste() {
        AperturaCaja apertura = new AperturaCaja();
        apertura.setCaja(new Caja());
        when(aperturaCajaService.exigirAperturaDeEmpresa(EMPRESA_PROPIA)).thenReturn(apertura);
        when(compraMapper.toEntity(any(CompraCreateRequest.class))).thenReturn(new Compra());
    }

    private void verificarQueNoSeRegistroNada() {
        verify(compraRepository, never()).save(any());
        verify(detalleCompraRepository, never()).save(any());
        verify(movimientoCajaRepository, never()).save(any());
        verify(cajaRepository, never()).save(any());
    }

    @Test
    void obtenerPorIdPermiteUnaCompraPropia() {
        Compra compra = compraDeEmpresa(EMPRESA_PROPIA);
        compraActivaExiste(compra);

        service.obtenerPorId(COMPRA_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(compraMapper).toResponse(compra);
    }

    @Test
    void obtenerPorIdRechazaUnaCompraAjena() {
        compraActivaExiste(compraDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(COMPRA_ID));

        verifyNoInteractions(compraMapper);
    }

    @Test
    void actualizarRechazaUnaCompraAjena() {
        compraActivaExiste(compraDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(COMPRA_ID, new CompraUpdateRequest(null, null)));

        verify(compraRepository, never()).save(any());
        verifyNoInteractions(compraMapper);
    }

    @Test
    void eliminarRechazaUnaCompraAjena() {
        Compra compra = compraDeEmpresa(EMPRESA_AJENA);
        compraActivaExiste(compra);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(COMPRA_ID));

        assertTrue(compra.isActive());
        verify(compraRepository, never()).save(any());
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        CompraCreateRequest request = new CompraCreateRequest(
            EMPRESA_AJENA, PROVEEDOR_ID, FORMA_PAGO_ID, null, null, List.of());

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, proveedorRepository, formaPagoRepository,
            productoRepository, inventarioRepository, aperturaCajaService);
        verificarQueNoSeRegistroNada();
    }

    @Test
    void crearRechazaUnProveedorDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(proveedorRepository.findById(PROVEEDOR_ID)).thenReturn(Optional.of(proveedorDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudConDetalle(PRODUCTO_ID, null)));

        verifyNoInteractions(formaPagoRepository, inventarioRepository, aperturaCajaService);
        verificarQueNoSeRegistroNada();
    }

    @Test
    void crearRechazaUnaFormaDePagoDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(proveedorRepository.findById(PROVEEDOR_ID)).thenReturn(Optional.of(proveedorDeEmpresa(EMPRESA_PROPIA)));
        when(formaPagoRepository.findById(FORMA_PAGO_ID)).thenReturn(Optional.of(formaPagoDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudConDetalle(PRODUCTO_ID, null)));

        verifyNoInteractions(inventarioRepository, aperturaCajaService);
        verificarQueNoSeRegistroNada();
    }

    @Test
    void crearRechazaUnProductoDeOtraEmpresa() {
        referenciasPropiasExisten();
        aperturaAbiertaExiste();
        when(productoRepository.findById(PRODUCTO_ID)).thenReturn(Optional.of(productoDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudConDetalle(PRODUCTO_ID, null)));

        verifyNoInteractions(inventarioRepository);
        verificarQueNoSeRegistroNada();
    }

    @Test
    void crearRechazaUnImpuestoDeOtraEmpresa() {
        referenciasPropiasExisten();
        aperturaAbiertaExiste();
        when(productoRepository.findById(PRODUCTO_ID)).thenReturn(Optional.of(productoDeEmpresa(EMPRESA_PROPIA)));
        Inventario inventario = new Inventario();
        inventario.setCantidadActual(new BigDecimal("10"));
        inventario.setCostoPromedio(new BigDecimal("5"));
        when(inventarioRepository.findByProductoIdAndActiveTrue(PRODUCTO_ID)).thenReturn(Optional.of(inventario));
        when(impuestoRepository.findById(IMPUESTO_ID)).thenReturn(Optional.of(impuestoDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.crear(solicitudConDetalle(PRODUCTO_ID, Set.of(IMPUESTO_ID))));

        verificarQueNoSeRegistroNada();
    }

    @Test
    void listarFiltraPorLaEmpresaDelUsuario() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        when(empresaAccesoService.empresaIdActual()).thenReturn(EMPRESA_PROPIA);
        when(compraRepository.findByActiveTrueAndEmpresaId(pageable, EMPRESA_PROPIA)).thenReturn(org.springframework.data.domain.Page.empty());

        service.listar(pageable);

        verify(compraRepository).findByActiveTrueAndEmpresaId(pageable, EMPRESA_PROPIA);
        verify(compraRepository, never()).findByActiveTrue(pageable);
    }
}
