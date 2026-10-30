package com.rowin.contabilidad.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LimiteIntentosRegistroTest {

    private static final String ORIGEN = "203.0.113.7";

    private RelojManual reloj;
    private LimiteIntentosRegistro limite;

    @BeforeEach
    void setUp() {
        reloj = new RelojManual();
        limite = new LimiteIntentosRegistro(reloj);
    }

    @Test
    void bloqueaConTooManyRequestsAlLlegarAlMaximoDeFallos() {
        for (int i = 0; i < LimiteIntentosRegistro.MAX_FALLOS - 1; i++) {
            limite.registrarFallo(ORIGEN);
        }
        assertDoesNotThrow(() -> limite.verificar(ORIGEN));

        limite.registrarFallo(ORIGEN);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> limite.verificar(ORIGEN));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
    }

    @Test
    void desbloqueaCuandoPasaLaVentana() {
        registrarFallos(ORIGEN, LimiteIntentosRegistro.MAX_FALLOS);
        assertThrows(ResponseStatusException.class, () -> limite.verificar(ORIGEN));

        reloj.avanzar(LimiteIntentosRegistro.VENTANA.plusSeconds(1));

        assertDoesNotThrow(() -> limite.verificar(ORIGEN));
    }

    @Test
    void losFallosAntiguosDejanDeContar() {
        registrarFallos(ORIGEN, 3);
        reloj.avanzar(Duration.ofMinutes(10));
        registrarFallos(ORIGEN, 2);
        assertThrows(ResponseStatusException.class, () -> limite.verificar(ORIGEN));

        reloj.avanzar(Duration.ofMinutes(6));

        assertDoesNotThrow(() -> limite.verificar(ORIGEN));
    }

    @Test
    void limpiarReiniciaElContador() {
        registrarFallos(ORIGEN, LimiteIntentosRegistro.MAX_FALLOS);

        limite.limpiar(ORIGEN);

        assertDoesNotThrow(() -> limite.verificar(ORIGEN));
    }

    @Test
    void cadaOrigenTieneSuPropioContador() {
        registrarFallos(ORIGEN, LimiteIntentosRegistro.MAX_FALLOS);

        assertThrows(ResponseStatusException.class, () -> limite.verificar(ORIGEN));
        assertDoesNotThrow(() -> limite.verificar("198.51.100.20"));
    }

    @Test
    void depurarEliminaLosOrigenesConFallosVencidos() {
        registrarFallos(ORIGEN, 2);
        registrarFallos("198.51.100.20", 1);
        assertEquals(2, limite.origenesRegistrados());

        reloj.avanzar(LimiteIntentosRegistro.VENTANA.plusSeconds(1));
        limite.depurar();

        assertEquals(0, limite.origenesRegistrados());
    }

    private void registrarFallos(String origen, int cantidad) {
        for (int i = 0; i < cantidad; i++) {
            limite.registrarFallo(origen);
        }
    }

    private static final class RelojManual extends Clock {

        private Instant ahora = Instant.parse("2026-10-30T10:00:00Z");

        void avanzar(Duration duracion) {
            ahora = ahora.plus(duracion);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zona) {
            return this;
        }

        @Override
        public Instant instant() {
            return ahora;
        }
    }
}
