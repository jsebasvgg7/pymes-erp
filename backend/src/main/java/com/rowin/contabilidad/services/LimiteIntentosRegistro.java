package com.rowin.contabilidad.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LimiteIntentosRegistro {

    static final int MAX_FALLOS = 5;
    static final Duration VENTANA = Duration.ofMinutes(15);

    private final Clock reloj;
    private final Map<String, Deque<Instant>> fallosPorOrigen = new ConcurrentHashMap<>();

    @Autowired
    public LimiteIntentosRegistro() {
        this(Clock.systemUTC());
    }

    LimiteIntentosRegistro(Clock reloj) {
        this.reloj = reloj;
    }

    public void verificar(String origen) {
        if (contarFallos(origen) >= MAX_FALLOS) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
        }
    }

    public void registrarFallo(String origen) {
        Instant ahora = reloj.instant();
        fallosPorOrigen.compute(origen, (clave, fallos) -> {
            Deque<Instant> actuales = fallos == null ? new ArrayDeque<>() : fallos;
            descartarVencidos(actuales, ahora);
            actuales.addLast(ahora);
            return actuales;
        });
    }

    public void limpiar(String origen) {
        fallosPorOrigen.remove(origen);
    }

    @Scheduled(fixedDelay = 3_600_000L)
    public void depurar() {
        Instant ahora = reloj.instant();
        fallosPorOrigen.replaceAll((clave, fallos) -> {
            descartarVencidos(fallos, ahora);
            return fallos;
        });
        fallosPorOrigen.values().removeIf(Deque::isEmpty);
    }

    int origenesRegistrados() {
        return fallosPorOrigen.size();
    }

    private int contarFallos(String origen) {
        Instant ahora = reloj.instant();
        Deque<Instant> fallos = fallosPorOrigen.computeIfPresent(origen, (clave, actuales) -> {
            descartarVencidos(actuales, ahora);
            return actuales.isEmpty() ? null : actuales;
        });
        return fallos == null ? 0 : fallos.size();
    }

    private void descartarVencidos(Deque<Instant> fallos, Instant ahora) {
        Instant limite = ahora.minus(VENTANA);
        while (!fallos.isEmpty() && !fallos.peekFirst().isAfter(limite)) {
            fallos.pollFirst();
        }
    }
}
