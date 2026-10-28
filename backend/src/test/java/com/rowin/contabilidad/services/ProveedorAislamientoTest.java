package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.proveedor.ProveedorCreateRequest;
import com.rowin.contabilidad.dto.proveedor.ProveedorUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Proveedor;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProveedorRepository;
import com.rowin.contabilidad.utils.mappers.ProveedorMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
class ProveedorAislamientoTest {

    private static final Long PROVEEDOR_ID = 40L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private ProveedorRepository proveedorRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private ProveedorMapper proveedorMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private ProveedorServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private Proveedor proveedorDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        Proveedor proveedor = new Proveedor();
        proveedor.setId(PROVEEDOR_ID);
        proveedor.setEmpresa(empresa);
        return proveedor;
    }

    private void proveedorActivoExiste(Proveedor proveedor) {
        when(proveedorRepository.findByIdAndActiveTrue(PROVEEDOR_ID)).thenReturn(Optional.of(proveedor));
    }

    @Test
    void obtenerPorIdPermiteUnProveedorPropio() {
        Proveedor proveedor = proveedorDeEmpresa(EMPRESA_PROPIA);
        proveedorActivoExiste(proveedor);

        service.obtenerPorId(PROVEEDOR_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(proveedorMapper).toResponse(proveedor);
    }

    @Test
    void obtenerPorIdRechazaUnProveedorAjeno() {
        proveedorActivoExiste(proveedorDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(PROVEEDOR_ID));

        verifyNoInteractions(proveedorMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        ProveedorCreateRequest request =
            new ProveedorCreateRequest(EMPRESA_AJENA, "Proveedor", null, null, null, null);

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, proveedorMapper);
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnProveedorAjeno() {
        proveedorActivoExiste(proveedorDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(PROVEEDOR_ID, new ProveedorUpdateRequest("Nuevo", null, null, null, null)));

        verifyNoInteractions(proveedorMapper);
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    void eliminarRechazaUnProveedorAjeno() {
        Proveedor proveedor = proveedorDeEmpresa(EMPRESA_AJENA);
        proveedorActivoExiste(proveedor);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(PROVEEDOR_ID));

        assertTrue(proveedor.isActive());
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    void eliminarFisicamenteRechazaUnProveedorAjeno() {
        when(proveedorRepository.findById(PROVEEDOR_ID))
            .thenReturn(Optional.of(proveedorDeEmpresa(EMPRESA_AJENA)));

        assertThrows(ResponseStatusException.class, () -> service.eliminarFisicamente(PROVEEDOR_ID));

        verify(proveedorRepository, never()).delete(any());
    }
}
