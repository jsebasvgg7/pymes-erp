package com.rowin.contabilidad.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UsuarioCreateRequest(
    @NotNull Long empresaId,
    @NotBlank @Size(max = 80) String username,
    @NotBlank @Email @Size(max = 150) String email,
    @NotBlank @Size(min = 6, max = 255) String password,
    Set<Long> rolIds
) {
}
