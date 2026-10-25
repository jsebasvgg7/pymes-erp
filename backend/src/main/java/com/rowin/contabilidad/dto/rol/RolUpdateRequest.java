package com.rowin.contabilidad.dto.rol;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public record RolUpdateRequest(
		@NotBlank(message = "El nombre es obligatorio") String nombre,

		String descripcion,

		Set<String> modulos) {
}