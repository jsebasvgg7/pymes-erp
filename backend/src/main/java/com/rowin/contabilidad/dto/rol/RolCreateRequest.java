package com.rowin.contabilidad.dto.rol;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public record RolCreateRequest(
		@NotNull(message = "La empresa es obligatoria") Long empresaId,

		@NotBlank(message = "El nombre es obligatorio") String nombre,

		String descripcion,

		Set<String> modulos) {
}