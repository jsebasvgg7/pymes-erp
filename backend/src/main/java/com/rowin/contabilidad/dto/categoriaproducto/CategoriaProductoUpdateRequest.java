package com.rowin.contabilidad.dto.categoriaproducto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoriaProductoUpdateRequest(
	@NotBlank @Size(max = 120) String nombre
) {
}

