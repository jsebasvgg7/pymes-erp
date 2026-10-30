package com.rowin.contabilidad.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class CodigoRegistroInvalidoException extends ResponseStatusException {

    public static final String MENSAJE = "Código de acceso inválido";

    public CodigoRegistroInvalidoException() {
        super(HttpStatus.FORBIDDEN, MENSAJE);
    }
}
