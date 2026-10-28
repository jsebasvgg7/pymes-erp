package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.cliente.ClienteCreateRequest;
import com.rowin.contabilidad.dto.cliente.ClienteUpdateRequest;
import com.rowin.contabilidad.entities.Cliente;
import com.rowin.contabilidad.entities.Empresa;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteAislamientoTest {

    private static final Long CLIENTE_ID = 20L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private ClienteRepository clienteRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ClienteMapper clienteMapper;
    @Mock private CuentaPorCobrarRepository cuentaPorCobrarRepository;
    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private CajaRepository cajaRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private FacturaVentaRepository facturaVentaRepository;
    @Mock private AperturaCajaService aperturaCajaService;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private ClienteServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private Cliente clienteDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        Cliente cliente = new Cliente();
        cliente.setId(CLIENTE_ID);
        cliente.setEmpresa(empresa);
        return cliente;
    }

    private void clienteActivoExiste(Cliente cliente) {
        when(clienteRepository.findByIdAndActiveTrue(CLIENTE_ID)).thenReturn(Optional.of(cliente));
    }

    @Test
    void obtenerPorIdPermiteUnClientePropio() {
        Cliente cliente = clienteDeEmpresa(EMPRESA_PROPIA);
        clienteActivoExiste(cliente);

        service.obtenerPorId(CLIENTE_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(clienteMapper).toResponse(cliente);
    }

    @Test
    void obtenerPorIdRechazaUnClienteAjeno() {
        clienteActivoExiste(clienteDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(CLIENTE_ID));

        verifyNoInteractions(clienteMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        ClienteCreateRequest request =
            new ClienteCreateRequest(EMPRESA_AJENA, "Cliente", null, null, null, null);

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository);
        verify(clienteRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnClienteAjeno() {
        clienteActivoExiste(clienteDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(CLIENTE_ID, new ClienteUpdateRequest("Nuevo", null, null, null, null)));

        verifyNoInteractions(clienteMapper);
        verify(clienteRepository, never()).save(any());
    }

    @Test
    void eliminarRechazaUnClienteAjeno() {
        Cliente cliente = clienteDeEmpresa(EMPRESA_AJENA);
        clienteActivoExiste(cliente);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(CLIENTE_ID));

        assertTrue(cliente.isActive());
        verify(clienteRepository, never()).save(any());
    }

    @Test
    void eliminarFisicamenteRechazaUnClienteAjeno() {
        when(clienteRepository.findById(CLIENTE_ID)).thenReturn(Optional.of(clienteDeEmpresa(EMPRESA_AJENA)));

        assertThrows(ResponseStatusException.class, () -> service.eliminarFisicamente(CLIENTE_ID));

        verify(clienteRepository, never()).delete(any());
    }

    @Test
    void obtenerSaldoPendienteRechazaUnClienteAjeno() {
        clienteActivoExiste(clienteDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerSaldoPendiente(CLIENTE_ID));

        verifyNoInteractions(cuentaPorCobrarRepository);
    }

    @Test
    void abonarDeudaRechazaUnClienteAjeno() {
        clienteActivoExiste(clienteDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.abonarDeuda(CLIENTE_ID, new BigDecimal("5000"), 3L));

        verifyNoInteractions(formaPagoRepository, aperturaCajaService, cajaRepository,
            movimientoCajaRepository, cuentaPorCobrarRepository, facturaVentaRepository);
    }
}
