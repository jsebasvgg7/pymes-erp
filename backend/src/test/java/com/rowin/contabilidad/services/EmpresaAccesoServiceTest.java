package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmpresaAccesoServiceTest {

    private static final String EMAIL = "admin@vegashop.com";

    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private EmpresaAccesoService service;

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    private void autenticar() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(EMAIL, null, AuthorityUtils.NO_AUTHORITIES));
    }

    private Usuario usuarioDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        return usuario;
    }

    private HttpStatus estadoDelRechazo(Long empresaId) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.exigir(empresaId));
        return HttpStatus.valueOf(ex.getStatusCode().value());
    }

    @Test
    void permiteLaEmpresaDelUsuario() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertDoesNotThrow(() -> service.exigir(7L));
    }

    @Test
    void rechazaOtraEmpresa() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(8L));
    }

    @Test
    void rechazaUnaEmpresaNula() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(null));
    }

    @Test
    void rechazaUsuarioInexistenteOInactivo() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(7L));
    }

    @Test
    void rechazaUsuarioSinEmpresa() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(new Usuario()));

        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(7L));
    }

    @Test
    void empresaIdActualDevuelveLaEmpresaDelUsuario() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertEquals(7L, service.empresaIdActual());
    }

    @Test
    void empresaIdActualRechazaSinSesion() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.empresaIdActual());

        assertEquals(HttpStatus.FORBIDDEN.value(), ex.getStatusCode().value());
        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void empresaIdActualRechazaUsuarioInexistenteOInactivo() {
        autenticar();
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.empresaIdActual());

        assertEquals(HttpStatus.FORBIDDEN.value(), ex.getStatusCode().value());
    }

    @Test
    void rechazaSinSesion() {
        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(7L));
        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void rechazaSesionAnonima() {
        SecurityContextHolder.getContext().setAuthentication(
            new AnonymousAuthenticationToken("clave", "anonimo", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));

        assertEquals(HttpStatus.FORBIDDEN, estadoDelRechazo(7L));
        verifyNoInteractions(usuarioRepository);
    }
}
