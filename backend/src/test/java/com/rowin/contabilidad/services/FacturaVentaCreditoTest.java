package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaUpdateRequest;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Cliente;
import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import com.rowin.contabilidad.entities.CuentaPorCobrar;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.EstadoCuenta;
import com.rowin.contabilidad.entities.FacturaEstado;
import com.rowin.contabilidad.entities.FacturaVenta;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.MovimientoCaja;
import com.rowin.contabilidad.entities.TipoFormaPago;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacturaVentaCreditoTest {
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

    private Empresa empresa;
    private Cliente cliente;
    private Caja caja;

    @BeforeEach
    void setUp() {
        empresa = new Empresa();
        empresa.setId(1L);

        cliente = new Cliente();
        cliente.setId(2L);
        cliente.setEmpresa(empresa);

        caja = new Caja();
        caja.setEmpresa(empresa);
        caja.setSaldoActual(new BigDecimal("1000"));
    }

    private FormaPago formaPago(TipoFormaPago tipo, Empresa duena) {
        FormaPago formaPago = new FormaPago();
        formaPago.setId(3L);
        formaPago.setEmpresa(duena);
        formaPago.setNombre(tipo.name());
        formaPago.setTipo(tipo);
        return formaPago;
    }

    private FacturaVentaCreateRequest request(Long clienteId) {
        DetalleFacturaRequest detalle = new DetalleFacturaRequest(
            null, "Servicio", new BigDecimal("2"), new BigDecimal("5000"), null
        );
        return new FacturaVentaCreateRequest(1L, clienteId, 3L, null, null, List.of(detalle));
    }

    private void stubFlujoDeVenta(FormaPago formaPago, FacturaVentaCreateRequest request, boolean conCliente) {
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        if (conCliente) {
            when(clienteRepository.findById(2L)).thenReturn(Optional.of(cliente));
        }
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago));
        AperturaCaja apertura = new AperturaCaja();
        apertura.setCaja(caja);
        when(aperturaCajaService.exigirAperturaDeEmpresa(1L)).thenReturn(apertura);
        when(facturaVentaMapper.toEntity(request)).thenReturn(new FacturaVenta());
        when(facturaVentaRepository.save(any(FacturaVenta.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void creditSaleCreatesReceivableAndDoesNotTouchCash() {
        FacturaVentaCreateRequest request = request(2L);
        stubFlujoDeVenta(formaPago(TipoFormaPago.CREDITO, empresa), request, true);

        service.crear(request);

        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
        verify(cajaRepository, never()).save(any(Caja.class));
        assertEquals(new BigDecimal("1000"), caja.getSaldoActual());

        ArgumentCaptor<CuentaPorCobrar> captor = ArgumentCaptor.forClass(CuentaPorCobrar.class);
        verify(cuentaPorCobrarRepository).save(captor.capture());
        assertEquals(new BigDecimal("10000"), captor.getValue().getSaldo());
        assertEquals(new BigDecimal("10000"), captor.getValue().getMontoOriginal());
        assertEquals(EstadoCuenta.ABIERTA, captor.getValue().getEstado());
        assertEquals(cliente, captor.getValue().getCliente());
    }

    @Test
    void cashSaleRegistersIncomeAndDoesNotCreateReceivable() {
        FacturaVentaCreateRequest request = request(null);
        stubFlujoDeVenta(formaPago(TipoFormaPago.EFECTIVO, empresa), request, false);

        service.crear(request);

        ArgumentCaptor<MovimientoCaja> captor = ArgumentCaptor.forClass(MovimientoCaja.class);
        verify(movimientoCajaRepository).save(captor.capture());
        assertEquals(new BigDecimal("10000"), captor.getValue().getMonto());
        assertEquals(new BigDecimal("11000"), caja.getSaldoActual());
        verify(cuentaPorCobrarRepository, never()).save(any(CuentaPorCobrar.class));
    }

    @Test
    void creditSaleWithoutClientIsRejected() {
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago(TipoFormaPago.CREDITO, empresa)));

        assertThrows(IllegalArgumentException.class, () -> service.crear(request(null)));

        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
    }

    @Test
    void saleWithPaymentMethodFromAnotherCompanyIsRejected() {
        Empresa otra = new Empresa();
        otra.setId(99L);
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago(TipoFormaPago.EFECTIVO, otra)));

        assertThrows(IllegalArgumentException.class, () -> service.crear(request(null)));

        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
    }

    @Test
    void saleWithClientFromAnotherCompanyIsRejected() {
        Empresa otra = new Empresa();
        otra.setId(99L);
        cliente.setEmpresa(otra);
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(clienteRepository.findById(2L)).thenReturn(Optional.of(cliente));
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago(TipoFormaPago.CREDITO, empresa)));

        assertThrows(IllegalArgumentException.class, () -> service.crear(request(2L)));

        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
    }

    @Test
    void markingInvoiceAsPaidWithPendingBalanceIsRejected() {
        FacturaVenta factura = new FacturaVenta();
        factura.setId(7L);
        factura.setEstado(FacturaEstado.EMITIDA);
        CuentaPorCobrar cuenta = new CuentaPorCobrar();
        cuenta.setSaldo(new BigDecimal("4000"));
        when(facturaVentaRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(factura));
        when(cuentaPorCobrarRepository.findByFacturaVentaIdAndActiveTrue(7L)).thenReturn(Optional.of(cuenta));

        assertThrows(
            IllegalArgumentException.class,
            () -> service.actualizarEstado(7L, new FacturaVentaUpdateRequest(FacturaEstado.PAGADA))
        );

        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
    }

    @Test
    void cancellingInvoiceClosesItsReceivable() {
        FacturaVenta factura = new FacturaVenta();
        factura.setId(7L);
        factura.setEstado(FacturaEstado.EMITIDA);
        CuentaPorCobrar cuenta = new CuentaPorCobrar();
        cuenta.setSaldo(new BigDecimal("4000"));
        when(facturaVentaRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(factura));
        when(cuentaPorCobrarRepository.findByFacturaVentaIdAndActiveTrue(7L)).thenReturn(Optional.of(cuenta));
        when(facturaVentaRepository.save(any(FacturaVenta.class))).thenAnswer(inv -> inv.getArgument(0));

        service.actualizarEstado(7L, new FacturaVentaUpdateRequest(FacturaEstado.ANULADA));

        assertEquals(BigDecimal.ZERO, cuenta.getSaldo());
        assertEquals(EstadoCuenta.CERRADA, cuenta.getEstado());
    }

    private ConfiguracionEmpresa configuracion(boolean clienteObligatorio, Integer dias) {
        ConfiguracionEmpresa configuracion = new ConfiguracionEmpresa();
        configuracion.setEmpresa(empresa);
        configuracion.setClienteObligatorio(clienteObligatorio);
        configuracion.setDiasVencimientoCredito(dias);
        return configuracion;
    }

    @Test
    void saleWithoutClientIsRejectedWhenClientIsRequired() {
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(formaPagoRepository.findById(3L)).thenReturn(Optional.of(formaPago(TipoFormaPago.EFECTIVO, empresa)));
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(true, null)));

        assertThrows(IllegalArgumentException.class, () -> service.crear(request(null)));

        verify(facturaVentaRepository, never()).save(any(FacturaVenta.class));
    }

    @Test
    void saleWithClientIsAcceptedWhenClientIsRequired() {
        FacturaVentaCreateRequest request = request(2L);
        stubFlujoDeVenta(formaPago(TipoFormaPago.EFECTIVO, empresa), request, true);
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(true, null)));

        service.crear(request);

        verify(movimientoCajaRepository).save(any(MovimientoCaja.class));
    }

    @Test
    void saleWithoutClientIsAcceptedWhenClientIsNotRequired() {
        FacturaVentaCreateRequest request = request(null);
        stubFlujoDeVenta(formaPago(TipoFormaPago.EFECTIVO, empresa), request, false);
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(false, null)));

        service.crear(request);

        verify(movimientoCajaRepository).save(any(MovimientoCaja.class));
    }

    @Test
    void creditSaleUsesConfiguredDueDays() {
        FacturaVentaCreateRequest request = request(2L);
        stubFlujoDeVenta(formaPago(TipoFormaPago.CREDITO, empresa), request, true);
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(false, 45)));
        LocalDateTime antes = LocalDateTime.now();

        service.crear(request);

        ArgumentCaptor<CuentaPorCobrar> captor = ArgumentCaptor.forClass(CuentaPorCobrar.class);
        verify(cuentaPorCobrarRepository).save(captor.capture());
        LocalDateTime vencimiento = captor.getValue().getFechaVencimiento();
        assertTrue(!vencimiento.isBefore(antes.plusDays(45)));
        assertTrue(!vencimiento.isAfter(LocalDateTime.now().plusDays(45)));
    }

    @Test
    void creditSaleHasNoDueDateWhenThereIsNoLimit() {
        FacturaVentaCreateRequest request = request(2L);
        stubFlujoDeVenta(formaPago(TipoFormaPago.CREDITO, empresa), request, true);
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(configuracion(false, null)));

        service.crear(request);

        ArgumentCaptor<CuentaPorCobrar> captor = ArgumentCaptor.forClass(CuentaPorCobrar.class);
        verify(cuentaPorCobrarRepository).save(captor.capture());
        assertNull(captor.getValue().getFechaVencimiento());
    }

    @Test
    void creditSaleHasNoDueDateWhenCompanyHasNoConfiguration() {
        FacturaVentaCreateRequest request = request(2L);
        stubFlujoDeVenta(formaPago(TipoFormaPago.CREDITO, empresa), request, true);

        service.crear(request);

        ArgumentCaptor<CuentaPorCobrar> captor = ArgumentCaptor.forClass(CuentaPorCobrar.class);
        verify(cuentaPorCobrarRepository).save(captor.capture());
        assertNull(captor.getValue().getFechaVencimiento());
    }
}
