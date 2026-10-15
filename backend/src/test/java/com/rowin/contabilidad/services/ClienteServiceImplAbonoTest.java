package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Cliente;
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
import com.rowin.contabilidad.repositories.CuentaPorCobrarRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FacturaVentaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.utils.mappers.ClienteMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceImplAbonoTest {
    @Mock private ClienteRepository clienteRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ClienteMapper clienteMapper;
    @Mock private CuentaPorCobrarRepository cuentaPorCobrarRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private FacturaVentaRepository facturaVentaRepository;

    @InjectMocks private ClienteServiceImpl service;

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
        cliente.setNombre("Cliente de prueba");

        caja = new Caja();
        caja.setEmpresa(empresa);
        caja.setSaldoActual(new BigDecimal("1000"));
    }

    private FormaPago formaPago(TipoFormaPago tipo, Empresa duena) {
        FormaPago formaPago = new FormaPago();
        formaPago.setId(3L);
        formaPago.setEmpresa(duena);
        formaPago.setTipo(tipo);
        return formaPago;
    }

    private CuentaPorCobrar cuenta(String saldo, FacturaVenta factura) {
        CuentaPorCobrar cuenta = new CuentaPorCobrar();
        cuenta.setCliente(cliente);
        cuenta.setFacturaVenta(factura);
        cuenta.setMontoOriginal(new BigDecimal(saldo));
        cuenta.setSaldo(new BigDecimal(saldo));
        cuenta.setEstado(EstadoCuenta.ABIERTA);
        return cuenta;
    }

    private void stubClienteYFormaPago(TipoFormaPago tipo, Empresa duenaFormaPago) {
        when(clienteRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(cliente));
        when(formaPagoRepository.findByIdAndActiveTrue(3L)).thenReturn(Optional.of(formaPago(tipo, duenaFormaPago)));
    }

    private void stubCajaYDeudas(CuentaPorCobrar... cuentas) {
        when(cajaRepository.findByEmpresaIdAndActiveTrue(1L)).thenReturn(List.of(caja));
        when(cuentaPorCobrarRepository.findPendientesByClienteId(2L)).thenReturn(List.of(cuentas));
    }

    @Test
    void partialPaymentReducesBalanceAndRegistersCashIncome() {
        CuentaPorCobrar cuenta = cuenta("10000", new FacturaVenta());
        stubClienteYFormaPago(TipoFormaPago.EFECTIVO, empresa);
        stubCajaYDeudas(cuenta);

        service.abonarDeuda(2L, new BigDecimal("4000"), 3L);

        assertEquals(new BigDecimal("6000"), cuenta.getSaldo());
        assertEquals(EstadoCuenta.PARCIAL, cuenta.getEstado());
        assertEquals(new BigDecimal("5000"), caja.getSaldoActual());
        ArgumentCaptor<MovimientoCaja> captor = ArgumentCaptor.forClass(MovimientoCaja.class);
        verify(movimientoCajaRepository).save(captor.capture());
        assertEquals(new BigDecimal("4000"), captor.getValue().getMonto());
    }

    @Test
    void fullPaymentMarksReceivableAndInvoiceAsPaid() {
        FacturaVenta factura = new FacturaVenta();
        factura.setEstado(FacturaEstado.EMITIDA);
        CuentaPorCobrar cuenta = cuenta("5000", factura);
        stubClienteYFormaPago(TipoFormaPago.TRANSFERENCIA, empresa);
        stubCajaYDeudas(cuenta);

        service.abonarDeuda(2L, new BigDecimal("5000"), 3L);

        assertEquals(EstadoCuenta.PAGADA, cuenta.getEstado());
        assertEquals(FacturaEstado.PAGADA, factura.getEstado());
        verify(facturaVentaRepository).save(factura);
    }

    @Test
    void paymentIsAppliedToOldestDebtsFirst() {
        CuentaPorCobrar antigua = cuenta("3000", new FacturaVenta());
        CuentaPorCobrar reciente = cuenta("5000", new FacturaVenta());
        stubClienteYFormaPago(TipoFormaPago.EFECTIVO, empresa);
        stubCajaYDeudas(antigua, reciente);

        service.abonarDeuda(2L, new BigDecimal("4000"), 3L);

        assertEquals(EstadoCuenta.PAGADA, antigua.getEstado());
        assertEquals(new BigDecimal("4000"), reciente.getSaldo());
        assertEquals(EstadoCuenta.PARCIAL, reciente.getEstado());
    }

    @Test
    void paymentAboveTheDebtIsRejected() {
        stubClienteYFormaPago(TipoFormaPago.EFECTIVO, empresa);
        stubCajaYDeudas(cuenta("5000", new FacturaVenta()));

        assertThrows(IllegalArgumentException.class, () -> service.abonarDeuda(2L, new BigDecimal("5001"), 3L));

        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
        assertEquals(new BigDecimal("1000"), caja.getSaldoActual());
    }

    @Test
    void paymentFromClientWithoutDebtIsRejected() {
        stubClienteYFormaPago(TipoFormaPago.EFECTIVO, empresa);
        stubCajaYDeudas();

        assertThrows(IllegalArgumentException.class, () -> service.abonarDeuda(2L, new BigDecimal("100"), 3L));

        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
    }

    @Test
    void paymentMethodFromAnotherCompanyIsRejected() {
        Empresa otra = new Empresa();
        otra.setId(99L);
        stubClienteYFormaPago(TipoFormaPago.EFECTIVO, otra);

        assertThrows(IllegalArgumentException.class, () -> service.abonarDeuda(2L, new BigDecimal("100"), 3L));

        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
    }

    @Test
    void paymentWithCreditMethodIsRejected() {
        stubClienteYFormaPago(TipoFormaPago.CREDITO, empresa);

        assertThrows(IllegalArgumentException.class, () -> service.abonarDeuda(2L, new BigDecimal("100"), 3L));

        verify(movimientoCajaRepository, never()).save(any(MovimientoCaja.class));
    }

    @Test
    void nonPositivePaymentIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.abonarDeuda(2L, BigDecimal.ZERO, 3L));
    }

    @Test
    void balancesByCompanyAreReturnedInOneQuery() {
        when(empresaRepository.findById(1L)).thenReturn(Optional.of(empresa));
        when(cuentaPorCobrarRepository.calcularSaldosPendientesPorEmpresa(1L)).thenReturn(
            Collections.singletonList(new Object[] {5L, new BigDecimal("1500.00")})
        );

        Map<Long, BigDecimal> saldos = service.obtenerSaldosPendientesPorEmpresa(1L);

        assertEquals(1, saldos.size());
        assertEquals(new BigDecimal("1500.00"), saldos.get(5L));
    }
}
