package com.rowin.contabilidad.dto.cliente;

import java.time.LocalDateTime;

public record ClienteResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    String nombre,
    String documento,
    String telefono,
    String email,
    String direccion
) {
}
