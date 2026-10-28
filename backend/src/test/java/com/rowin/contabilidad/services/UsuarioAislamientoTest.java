package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.usuario.UsuarioCreateRequest;
import com.rowin.contabilidad.dto.usuario.UsuarioUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.utils.mappers.UsuarioMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioAislamientoTest {

    private static final Long USUARIO_ID = 10L;
    private static final Long ROL_ID = 20L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private RolRepository rolRepository;
    @Mock private UsuarioMapper usuarioMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private UsuarioServiceImpl service;

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

    private Usuario usuarioDeEmpresa(Long empresaId) {
        Usuario usuario = new Usuario();
        usuario.setId(USUARIO_ID);
        usuario.setEmpresa(empresa(empresaId));
        return usuario;
    }

    private Rol rolDeEmpresa(Long empresaId) {
        Rol rol = new Rol();
        rol.setId(ROL_ID);
        rol.setEmpresa(empresa(empresaId));
        return rol;
    }

    private void usuarioActivoExiste(Usuario usuario) {
        when(usuarioRepository.findByIdAndActiveTrue(USUARIO_ID)).thenReturn(Optional.of(usuario));
    }

    private UsuarioUpdateRequest actualizacionConRoles(Set<Long> rolIds) {
        return new UsuarioUpdateRequest("usuario", "usuario@correo.com", null, rolIds);
    }

    @Test
    void obtenerPorIdPermiteUnUsuarioPropio() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_PROPIA);
        usuarioActivoExiste(usuario);

        service.obtenerPorId(USUARIO_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(usuarioMapper).toResponse(usuario);
    }

    @Test
    void obtenerPorIdRechazaUnUsuarioAjeno() {
        usuarioActivoExiste(usuarioDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(USUARIO_ID));

        verifyNoInteractions(usuarioMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        UsuarioCreateRequest request =
            new UsuarioCreateRequest(EMPRESA_AJENA, "usuario", "usuario@correo.com", "secreto1", null);

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, usuarioMapper, passwordEncoder);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearRechazaUnRolDeOtraEmpresa() {
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(usuarioRepository.existsByUsernameAndActiveTrue("usuario")).thenReturn(false);
        when(usuarioRepository.existsByEmailAndActiveTrue("usuario@correo.com")).thenReturn(false);
        when(usuarioMapper.toEntity(any(UsuarioCreateRequest.class), any(Empresa.class)))
            .thenReturn(usuarioDeEmpresa(EMPRESA_PROPIA));
        when(passwordEncoder.encode("secreto1")).thenReturn("hash");
        when(rolRepository.findById(ROL_ID)).thenReturn(Optional.of(rolDeEmpresa(EMPRESA_AJENA)));
        UsuarioCreateRequest request =
            new UsuarioCreateRequest(EMPRESA_PROPIA, "usuario", "usuario@correo.com", "secreto1", Set.of(ROL_ID));

        assertThrows(IllegalArgumentException.class, () -> service.crear(request));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearAsignaUnRolDeLaMismaEmpresa() {
        Usuario nuevo = usuarioDeEmpresa(EMPRESA_PROPIA);
        Rol rol = rolDeEmpresa(EMPRESA_PROPIA);
        when(empresaRepository.findById(EMPRESA_PROPIA)).thenReturn(Optional.of(empresa(EMPRESA_PROPIA)));
        when(usuarioMapper.toEntity(any(UsuarioCreateRequest.class), any(Empresa.class))).thenReturn(nuevo);
        when(passwordEncoder.encode("secreto1")).thenReturn("hash");
        when(rolRepository.findById(ROL_ID)).thenReturn(Optional.of(rol));
        when(usuarioRepository.save(nuevo)).thenReturn(nuevo);
        UsuarioCreateRequest request =
            new UsuarioCreateRequest(EMPRESA_PROPIA, "usuario", "usuario@correo.com", "secreto1", Set.of(ROL_ID));

        service.crear(request);

        assertEquals(Set.of(rol), nuevo.getRoles());
        verify(usuarioRepository).save(nuevo);
    }

    @Test
    void actualizarRechazaUnUsuarioAjeno() {
        usuarioActivoExiste(usuarioDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(USUARIO_ID, actualizacionConRoles(null)));

        verifyNoInteractions(usuarioMapper, passwordEncoder, rolRepository);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnRolDeOtraEmpresa() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_PROPIA);
        usuarioActivoExiste(usuario);
        when(rolRepository.findById(ROL_ID)).thenReturn(Optional.of(rolDeEmpresa(EMPRESA_AJENA)));

        assertThrows(IllegalArgumentException.class,
            () -> service.actualizar(USUARIO_ID, actualizacionConRoles(Set.of(ROL_ID))));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void actualizarAsignaUnRolDeLaMismaEmpresa() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_PROPIA);
        Rol rol = rolDeEmpresa(EMPRESA_PROPIA);
        usuarioActivoExiste(usuario);
        when(rolRepository.findById(ROL_ID)).thenReturn(Optional.of(rol));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);

        service.actualizar(USUARIO_ID, actualizacionConRoles(Set.of(ROL_ID)));

        assertEquals(Set.of(rol), usuario.getRoles());
    }

    @Test
    void eliminarRechazaUnUsuarioAjeno() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_AJENA);
        usuarioActivoExiste(usuario);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(USUARIO_ID));

        assertTrue(usuario.isActive());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void cambiarEstadoRechazaUnUsuarioAjeno() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_AJENA);
        when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));

        assertThrows(ResponseStatusException.class, () -> service.cambiarEstado(USUARIO_ID, false));

        assertTrue(usuario.isActive());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void cambiarEstadoPermiteUnUsuarioPropio() {
        Usuario usuario = usuarioDeEmpresa(EMPRESA_PROPIA);
        when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));

        service.cambiarEstado(USUARIO_ID, false);

        assertTrue(!usuario.isActive());
        verify(usuarioRepository).save(usuario);
    }
}
