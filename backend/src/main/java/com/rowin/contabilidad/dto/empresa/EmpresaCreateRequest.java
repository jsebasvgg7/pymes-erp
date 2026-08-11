package com.rowin.contabilidad.dto.empresa;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmpresaCreateRequest(
	@NotBlank @Size(max = 200) String nombre,
	@Size(max = 50) String nit,
	@Size(max = 255) String direccion,
	@Size(max = 50) String telefono,
	@Email @Size(max = 150) String email
) {
}

