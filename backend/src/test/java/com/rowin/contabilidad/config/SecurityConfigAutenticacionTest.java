package com.rowin.contabilidad.config;

import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecurityConfigAutenticacionTest.RutaDePrueba.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    EmpresaAccesoInterceptor.class,
    SecurityConfigAutenticacionTest.RutaDePrueba.class
})
class SecurityConfigAutenticacionTest {

    @RestController
    static class RutaDePrueba {

        @GetMapping("/api/ruta-de-prueba")
        String protegida() {
            return "ok";
        }

        @GetMapping("/api/auth/bootstrap-status")
        String publica() {
            return "ok";
        }
    }

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private CustomUserDetailsService customUserDetailsService;
    @MockBean private UsuarioRepository usuarioRepository;

    @Test
    void protectedRouteWithoutTokenRespondsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/ruta-de-prueba"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRouteWithInvalidTokenRespondsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/ruta-de-prueba").header("Authorization", "Bearer token-vencido"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void publicRouteIsNotBlockedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/bootstrap-status"))
            .andExpect(status().isOk());
    }
}
