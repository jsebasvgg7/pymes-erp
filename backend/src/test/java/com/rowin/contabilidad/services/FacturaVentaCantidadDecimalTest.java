package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FacturaVenta;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.entities.UnidadMedida;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.ClienteRepository;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import com.rowin.contabilidad.repositories.CuentaPorCobrarRepository;
import com.rowin.contabilidad.repositories.DetalleFacturaRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FacturaVentaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.ImpuestoRepository;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.utils.mappers.FacturaVentaMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FacturaVentaCantidadDecimalTest {
    @Mock private FacturaVentaRepository facturaVentaRepository;
    @Mock private DetalleFacturaRepository detalleFacturaRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private InventarioRepository inventarioRepository;
    @Mock private ImpuestoRepository impuestoRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private FacturaVentaMapper facturaVentaMapper;
    @Mock private CuentaPorCobrarRepository cuentaPorCobrarRepository;
    @Mock private AperturaCajaService aperturaCajaService;
    @Mock private ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    @InjectMocks private FacturaVentaServiceImpl service;

    private Producto producto;
    private Inventario inventario;

    @BeforeEach
    void setUp() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);

        FormaPago formaPago = new FormaPago();
        formaPago.setId(3L);
        formaPago.setEmpresa(empresa);
        formaPago.setTipo(TipoFormaPago.EFECTIVO);

        Caja caja = new Caja();
        caja.setEmpresa(empresa);
        caja.setSaldoActual(BigDecimal.ZERO);

        producto = new Producto();
        producto.setId(10L);
        producto.setNombre("Desinfectante");

        inventario = new Inventario();
        inventario.setProducto(producto);

        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago));
        AperturaCaja apertura = new AperturaCaja();
        apertura.setCaja(caja);
        when(aperturaCajaService.exigirAperturaDeEmpresa(1L)).thenReturn(apertura);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(facturaVentaMapper.toEntity(any(FacturaVentaCreateRequest.class))).thenReturn(new FacturaVenta());
    }

    private FacturaVentaCreateRequest request(String cantidad, String precio) {
        DetalleFacturaRequest detalle = new DetalleFacturaRequest(
            10L, "Desinfectante", new BigDecimal(cantidad), new BigDecimal(precio), null
        );
        return new FacturaVentaCreateRequest(1L, null, 3L, null, null, List.of(detalle));
    }

    private void productoConStock(UnidadMedida unidad, String stock) {
        producto.setUnidadMedida(unidad);
        inventario.setCantidadActual(new BigDecimal(stock));
        when(inventarioRepository.findByProductoIdAndActiveTrue(10L)).thenReturn(Optional.of(inventario));
    }

    private FacturaVenta ventaGuardada() {
        ArgumentCaptor<FacturaVenta> captor = ArgumentCaptor.forClass(FacturaVenta.class);
        verify(facturaVentaRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void kilogramProductAcceptsHalfAndDiscountsStock() {
        productoConStock(UnidadMedida.KILOGRAMO, "2");
        when(facturaVentaRepository.save(any(FacturaVenta.class))).thenAnswer(inv -> inv.getArgument(0));

        service.crear(request("0.5", "12000"));

        assertEquals(0, new BigDecimal("1.5").compareTo(inventario.getCantidadActual()));
        assertEquals(0, new BigDecimal("6000").compareTo(ventaGuardada().getTotal()));
    }

    @Test
    void unitProductRejectsDecimalQuantity() {
        productoConStock(UnidadMedida.UNIDAD, "10");

        assertThrows(IllegalArgumentException.class, () -> service.crear(request("0.5", "3000")));

        verify(inventarioRepository, never()).save(any(Inventario.class));
        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
    }

    @Test
    void unitProductAcceptsWholeQuantityWrittenWithDecimals() {
        productoConStock(UnidadMedida.UNIDAD, "10");
        when(facturaVentaRepository.save(any(FacturaVenta.class))).thenAnswer(inv -> inv.getArgument(0));

        service.crear(request("2.000", "3000"));

        assertEquals(0, new BigDecimal("8").compareTo(inventario.getCantidadActual()));
    }

    @Test
    void rejectsMoreThanThreeDecimals() {
        productoConStock(UnidadMedida.KILOGRAMO, "5");

        assertThrows(IllegalArgumentException.class, () -> service.crear(request("0.5555", "1000")));

        verify(inventarioRepository, never()).save(any(Inventario.class));
    }

    @Test
    void rejectsDecimalQuantityAboveStock() {
        productoConStock(UnidadMedida.KILOGRAMO, "0.3");

        assertThrows(IllegalArgumentException.class, () -> service.crear(request("0.5", "1000")));

        assertEquals(0, new BigDecimal("0.3").compareTo(inventario.getCantidadActual()));
        verify(inventarioRepository, never()).save(any(Inventario.class));
    }

    @Test
    void lineTotalIsRoundedToTwoDecimals() {
        productoConStock(UnidadMedida.KILOGRAMO, "5");
        when(facturaVentaRepository.save(any(FacturaVenta.class))).thenAnswer(inv -> inv.getArgument(0));

        service.crear(request("0.333", "1001"));

        FacturaVenta venta = ventaGuardada();
        assertEquals(new BigDecimal("333.33"), venta.getSubtotal());
        assertEquals(new BigDecimal("333.33"), venta.getTotal());
    }
}
