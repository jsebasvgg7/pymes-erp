package com.rowin.contabilidad.dto.usuario;

import com.rowin.contabilidad.dto.rol.RolResponse;

import java.time.LocalDateTime;
import java.util.Set;

public record UsuarioResponse(
    Long id,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    boolean active,
    Long empresaId,
    String username,
    String email,
    Set<RolResponse> roles
) {
}
