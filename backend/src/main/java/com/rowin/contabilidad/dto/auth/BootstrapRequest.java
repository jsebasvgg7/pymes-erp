package com.rowin.contabilidad.dto.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BootstrapRequest(
    @Valid @NotNull EmpresaData empresa,
    @Valid @NotNull AdministradorData administrador
) {
    public record EmpresaData(
        @Size(max = 200) String nombre,
        @Size(max = 50) String nit,
        @Size(max = 255) String direccion,
        @Size(max = 50) String telefono,
        @Email @Size(max = 150) String email
    ) {
    }

    public record AdministradorData(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 255) String password
    ) {
    }
}
