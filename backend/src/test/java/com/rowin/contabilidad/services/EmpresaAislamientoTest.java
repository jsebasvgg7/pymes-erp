package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.EmpresaMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmpresaAislamientoTest {

    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private EmpresaRepository empresaRepository;
    @Mock private EmpresaMapper empresaMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private EmpresaServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
        lenient().when(empresaAccesoService.empresaIdActual()).thenReturn(EMPRESA_PROPIA);
    }

    private Empresa empresa(Long id) {
        Empresa empresa = new Empresa();
        empresa.setId(id);
        return empresa;
    }

    private EmpresaUpdateRequest actualizacion() {
        return new EmpresaUpdateRequest("Nueva", null, null, null, null);
    }

    @Test
    void obtenerPorIdPermiteLaEmpresaPropia() {
        Empresa propia = empresa(EMPRESA_PROPIA);
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(propia));

        service.obtenerPorId(EMPRESA_PROPIA);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(empresaMapper).toResponse(propia);
    }

    @Test
    void obtenerPorIdRechazaUnaEmpresaAjenaSinConsultarla() {
        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(EMPRESA_AJENA));

        verifyNoInteractions(empresaRepository, empresaMapper);
    }

    @Test
    void actualizarPermiteLaEmpresaPropia() {
        Empresa propia = empresa(EMPRESA_PROPIA);
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(propia));
        when(empresaRepository.save(propia)).thenReturn(propia);

        service.actualizar(EMPRESA_PROPIA, actualizacion());

        verify(empresaMapper).updateEntity(any(EmpresaUpdateRequest.class), any(Empresa.class));
        verify(empresaRepository).save(propia);
    }

    @Test
    void actualizarRechazaUnaEmpresaAjenaSinConsultarla() {
        assertThrows(ResponseStatusException.class, () -> service.actualizar(EMPRESA_AJENA, actualizacion()));

        verifyNoInteractions(empresaRepository, empresaMapper);
    }

    @Test
    void listarDevuelveSoloLaEmpresaDelUsuario() {
        Empresa propia = empresa(EMPRESA_PROPIA);
        EmpresaResponse respuesta = mock(EmpresaResponse.class);
        when(empresaRepository.findByIdAndActiveTrue(EMPRESA_PROPIA)).thenReturn(Optional.of(propia));
        when(empresaMapper.toResponse(propia)).thenReturn(respuesta);

        Page<EmpresaResponse> pagina = service.listar(PageRequest.of(0, 20));

        assertEquals(1, pagina.getTotalElements());
        assertEquals(respuesta, pagina.getContent().get(0));
        verify(empresaRepository, never()).findByActiveTrue(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void listarSinContenidoEnPaginasSiguientes() {
        Empresa propia = empresa(EMPRESA_PROPIA);
        when(empresaRepository.findByIdAndActiveTrue(EMPRESA_PROPIA)).thenReturn(Optional.of(propia));
        when(empresaMapper.toResponse(propia)).thenReturn(mock(EmpresaResponse.class));

        Page<EmpresaResponse> pagina = service.listar(PageRequest.of(1, 20));

        assertTrue(pagina.getContent().isEmpty());
        assertEquals(1, pagina.getTotalElements());
    }

    @Test
    void listarDevuelveVacioSiLaEmpresaEstaInactiva() {
        when(empresaRepository.findByIdAndActiveTrue(EMPRESA_PROPIA)).thenReturn(Optional.empty());

        Page<EmpresaResponse> pagina = service.listar(PageRequest.of(0, 20));

        assertTrue(pagina.getContent().isEmpty());
        assertEquals(0, pagina.getTotalElements());
    }

    @Test
    void crearEstaCerrado() {
        EmpresaCreateRequest request = new EmpresaCreateRequest("Otra", null, null, null, null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.crear(request));

        assertEquals(HttpStatus.FORBIDDEN.value(), ex.getStatusCode().value());
        verifyNoInteractions(empresaRepository, empresaMapper);
    }

    @Test
    void eliminarEstaCerradoAunParaLaEmpresaPropia() {
        ResponseStatusException ex =
            assertThrows(ResponseStatusException.class, () -> service.eliminar(EMPRESA_PROPIA));

        assertEquals(HttpStatus.FORBIDDEN.value(), ex.getStatusCode().value());
        verifyNoInteractions(empresaRepository, empresaMapper);
    }
}
