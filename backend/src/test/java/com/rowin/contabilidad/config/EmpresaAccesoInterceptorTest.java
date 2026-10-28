package com.rowin.contabilidad.config;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmpresaAccesoInterceptorTest {

    private static final String EMAIL = "admin@vegashop.com";

    @Mock private UsuarioRepository usuarioRepository;

    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    private EmpresaAccesoInterceptor interceptor() {
        return new EmpresaAccesoInterceptor(usuarioRepository);
    }

    private MockHttpServletRequest peticion(Map<String, String> variables) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (variables != null) {
            request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, variables);
        }
        return request;
    }

    private void autenticar(String email) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(email, null, AuthorityUtils.NO_AUTHORITIES));
    }

    private Usuario usuarioDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        return usuario;
    }

    private ResponseStatusException rechazo(Map<String, String> variables) {
        return assertThrows(ResponseStatusException.class,
            () -> interceptor().preHandle(peticion(variables), response, new Object()));
    }

    @Test
    void permiteElAccesoCuandoLaEmpresaEsLaDelUsuario() {
        autenticar(EMAIL);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertTrue(interceptor().preHandle(peticion(Map.of("empresaId", "7")), response, new Object()));
    }

    @Test
    void respondeForbiddenCuandoLaEmpresaEsOtra() {
        autenticar(EMAIL);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(usuarioDeEmpresa(7L)));

        assertEquals(HttpStatus.FORBIDDEN, rechazo(Map.of("empresaId", "8")).getStatusCode());
    }

    @Test
    void respondeForbiddenCuandoElUsuarioNoExisteOEstaInactivo() {
        autenticar(EMAIL);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.FORBIDDEN, rechazo(Map.of("empresaId", "7")).getStatusCode());
    }

    @Test
    void respondeForbiddenCuandoElUsuarioNoTieneEmpresa() {
        autenticar(EMAIL);
        when(usuarioRepository.findByEmailAndActiveTrue(EMAIL)).thenReturn(Optional.of(new Usuario()));

        assertEquals(HttpStatus.FORBIDDEN, rechazo(Map.of("empresaId", "7")).getStatusCode());
    }

    @Test
    void respondeForbiddenSinAutenticacion() {
        assertEquals(HttpStatus.FORBIDDEN, rechazo(Map.of("empresaId", "7")).getStatusCode());
        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void respondeForbiddenConAutenticacionAnonima() {
        SecurityContextHolder.getContext().setAuthentication(
            new AnonymousAuthenticationToken("clave", "anonimo", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));

        assertEquals(HttpStatus.FORBIDDEN, rechazo(Map.of("empresaId", "7")).getStatusCode());
        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void respondeBadRequestCuandoElIdentificadorNoEsNumerico() {
        autenticar(EMAIL);

        assertEquals(HttpStatus.BAD_REQUEST, rechazo(Map.of("empresaId", "abc")).getStatusCode());
    }

    @Test
    void ignoraLasRutasSinEmpresaId() {
        assertTrue(interceptor().preHandle(peticion(Map.of("id", "5")), response, new Object()));
        assertTrue(interceptor().preHandle(peticion(null), response, new Object()));
        verifyNoInteractions(usuarioRepository);
    }
}
