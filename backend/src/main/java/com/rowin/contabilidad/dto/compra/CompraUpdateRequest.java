package com.rowin.contabilidad.dto.compra;

import com.rowin.contabilidad.entities.CompraEstado;

import java.time.LocalDateTime;

public record CompraUpdateRequest(
    CompraEstado estado,
    LocalDateTime fechaVencimiento
) {
}
