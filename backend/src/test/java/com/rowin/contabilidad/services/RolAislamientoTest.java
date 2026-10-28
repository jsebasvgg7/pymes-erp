package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.rol.RolCreateRequest;
import com.rowin.contabilidad.dto.rol.RolUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.utils.mappers.RolMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
class RolAislamientoTest {

    private static final Long ROL_ID = 20L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private RolRepository rolRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private RolMapper rolMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private RolServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private Rol rolDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        Rol rol = new Rol();
        rol.setId(ROL_ID);
        rol.setEmpresa(empresa);
        return rol;
    }

    private void rolExiste(Rol rol) {
        when(rolRepository.findById(ROL_ID)).thenReturn(Optional.of(rol));
    }

    @Test
    void obtenerPorIdPermiteUnRolPropio() {
        Rol rol = rolDeEmpresa(EMPRESA_PROPIA);
        rolExiste(rol);

        service.obtenerPorId(ROL_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(rolMapper).toResponse(rol);
    }

    @Test
    void obtenerPorIdRechazaUnRolAjeno() {
        rolExiste(rolDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(ROL_ID));

        verifyNoInteractions(rolMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        RolCreateRequest request = new RolCreateRequest(EMPRESA_AJENA, "Cajero", null, Set.of());

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, rolMapper);
        verify(rolRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnRolAjeno() {
        rolExiste(rolDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(ROL_ID, new RolUpdateRequest("Nuevo", null, Set.of())));

        verifyNoInteractions(rolMapper);
        verify(rolRepository, never()).save(any());
    }

    @Test
    void eliminarRechazaUnRolAjeno() {
        Rol rol = rolDeEmpresa(EMPRESA_AJENA);
        rolExiste(rol);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(ROL_ID));

        assertTrue(rol.isActive());
        verify(rolRepository, never()).save(any());
    }

    @Test
    void eliminarDesactivaUnRolPropio() {
        Rol rol = rolDeEmpresa(EMPRESA_PROPIA);
        rolExiste(rol);

        service.eliminar(ROL_ID);

        assertTrue(!rol.isActive());
        verify(rolRepository).save(rol);
    }

    @Test
    void listarFiltraPorLaEmpresaDelUsuario() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        when(empresaAccesoService.empresaIdActual()).thenReturn(EMPRESA_PROPIA);
        when(rolRepository.findByActiveTrueAndEmpresaId(pageable, EMPRESA_PROPIA)).thenReturn(org.springframework.data.domain.Page.empty());

        service.listar(pageable);

        verify(rolRepository).findByActiveTrueAndEmpresaId(pageable, EMPRESA_PROPIA);
        verify(rolRepository, never()).findByActiveTrue(pageable);
    }
}
