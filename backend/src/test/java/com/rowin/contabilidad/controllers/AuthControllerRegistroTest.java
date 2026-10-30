package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.auth.RegistroClienteRequest;
import com.rowin.contabilidad.exceptions.CodigoRegistroInvalidoException;
import com.rowin.contabilidad.services.AuthService;
import com.rowin.contabilidad.services.LimiteIntentosRegistro;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerRegistroTest {

    private static final String ORIGEN = "203.0.113.7";

    @Mock
    private AuthService authService;
    @Mock
    private LimiteIntentosRegistro limiteIntentosRegistro;

    @InjectMocks
    private AuthController controller;

    private MockHttpServletRequest httpRequest;
    private RegistroClienteRequest request;

    @BeforeEach
    void setUp() {
        httpRequest = new MockHttpServletRequest();
        httpRequest.setRemoteAddr(ORIGEN);
        request = new RegistroClienteRequest("Tienda Nueva", "dueno", "dueno@example.com", "ClaveSegura123", "CODIGO");
    }

    @Test
    void registroExitosoResponde200YReiniciaElContadorDelOrigen() {
        LoginResponse esperada = new LoginResponse("jwt-token", "Bearer", null);
        when(authService.registrarClienteSaaS(request)).thenReturn(esperada);

        ResponseEntity<LoginResponse> respuesta = controller.registroClienteSaaS(request, httpRequest);

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        assertEquals(esperada, respuesta.getBody());
        verify(limiteIntentosRegistro).verificar(ORIGEN);
        verify(limiteIntentosRegistro).limpiar(ORIGEN);
        verify(limiteIntentosRegistro, never()).registrarFallo(anyString());
    }

    @Test
    void codigoInvalidoRegistraElFalloYRelanzaLaExcepcion() {
        when(authService.registrarClienteSaaS(request)).thenThrow(new CodigoRegistroInvalidoException());

        CodigoRegistroInvalidoException exception = assertThrows(
                CodigoRegistroInvalidoException.class,
                () -> controller.registroClienteSaaS(request, httpRequest));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(limiteIntentosRegistro).registrarFallo(ORIGEN);
        verify(limiteIntentosRegistro, never()).limpiar(anyString());
    }

    @Test
    void origenBloqueadoNoLlegaAlServicio() {
        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS))
                .when(limiteIntentosRegistro).verificar(ORIGEN);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.registroClienteSaaS(request, httpRequest));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        verifyNoInteractions(authService);
    }

    @Test
    void otrosErroresNoCuentanComoIntentoFallido() {
        when(authService.registrarClienteSaaS(request))
                .thenThrow(new IllegalArgumentException("El correo electrónico ya está registrado."));

        assertThrows(IllegalArgumentException.class, () -> controller.registroClienteSaaS(request, httpRequest));

        verify(limiteIntentosRegistro, never()).registrarFallo(anyString());
        verify(limiteIntentosRegistro, never()).limpiar(anyString());
    }
}
