package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.config.EmpresaAccesoInterceptor;
import com.rowin.contabilidad.config.JwtAuthenticationFilter;
import com.rowin.contabilidad.config.JwtTokenProvider;
import com.rowin.contabilidad.config.SecurityConfig;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PingController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    EmpresaAccesoInterceptor.class
})
class PingControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private CustomUserDetailsService customUserDetailsService;
    @MockBean private UsuarioRepository usuarioRepository;

    @Test
    void respondeOkSinTokenYSinTocarLaBaseDeDatos() throws Exception {
        mockMvc.perform(get("/api/ping"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("ok"));
    }
}
