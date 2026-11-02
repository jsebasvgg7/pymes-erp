package com.rowin.contabilidad.dto.categoriaproducto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoriaProductoCreateRequest(
	@NotNull Long empresaId,
	@NotBlank @Size(max = 120) String nombre,
	@Size(max = 40) @Pattern(regexp = "^[a-z0-9-]*$") String icono
) {
}

