package com.rowin.contabilidad.dto.proveedor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProveedorCreateRequest(
    @NotNull Long empresaId,
    @NotBlank @Size(max = 200) String nombre,
    @Size(max = 60) String documento,
    @Size(max = 50) String telefono,
    @Email @Size(max = 150) String email,
    @Size(max = 255) String direccion
) {
}
