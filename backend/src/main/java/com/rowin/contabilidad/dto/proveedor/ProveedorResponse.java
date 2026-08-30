package com.rowin.contabilidad.dto.proveedor;

import java.time.LocalDateTime;

public record ProveedorResponse(
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
