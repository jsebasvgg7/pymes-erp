package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FacturaEstado;
import com.rowin.contabilidad.entities.FacturaVenta;
import com.rowin.contabilidad.utils.mappers.FacturaVentaMapper;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacturaVentaAislamientoTest {

    private static final Long FACTURA_ID = 10L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

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
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private FacturaVentaServiceImpl service;

    private FacturaVenta facturaDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        FacturaVenta factura = new FacturaVenta();
        factura.setId(FACTURA_ID);
        factura.setEmpresa(empresa);
        factura.setEstado(FacturaEstado.EMITIDA);
        return factura;
    }

    private void facturaExiste(FacturaVenta factura) {
        when(facturaVentaRepository.findByIdAndActiveTrue(FACTURA_ID)).thenReturn(Optional.of(factura));
    }

    private void empresaAjenaRechazada() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    @Test
    void obtenerPorIdPermiteLaFacturaDeLaPropiaEmpresa() {
        FacturaVenta factura = facturaDeEmpresa(EMPRESA_PROPIA);
        facturaExiste(factura);

        service.obtenerPorId(FACTURA_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(facturaVentaMapper).toResponse(factura);
    }

    @Test
    void obtenerPorIdRechazaLaFacturaDeOtraEmpresa() {
        facturaExiste(facturaDeEmpresa(EMPRESA_AJENA));
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(FACTURA_ID));

        verifyNoInteractions(facturaVentaMapper);
    }

    @Test
    void actualizarEstadoRechazaLaFacturaDeOtraEmpresa() {
        FacturaVenta factura = facturaDeEmpresa(EMPRESA_AJENA);
        facturaExiste(factura);
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class,
            () -> service.actualizarEstado(FACTURA_ID, new FacturaVentaUpdateRequest(FacturaEstado.ANULADA)));

        assertEquals(FacturaEstado.EMITIDA, factura.getEstado());
        verify(facturaVentaRepository, never()).save(any());
        verifyNoInteractions(cuentaPorCobrarRepository);
    }

    @Test
    void eliminarRechazaLaFacturaDeOtraEmpresa() {
        FacturaVenta factura = facturaDeEmpresa(EMPRESA_AJENA);
        facturaExiste(factura);
        empresaAjenaRechazada();

        assertThrows(ResponseStatusException.class, () -> service.eliminar(FACTURA_ID));

        assertTrue(factura.isActive());
        verify(facturaVentaRepository, never()).save(any());
    }

    @Test
    void crearRechazaUnaVentaAUnaEmpresaAjena() {
        empresaAjenaRechazada();
        FacturaVentaCreateRequest request =
            new FacturaVentaCreateRequest(EMPRESA_AJENA, null, 3L, null, null, List.of());

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, facturaVentaRepository, movimientoCajaRepository, aperturaCajaService);
    }
}
