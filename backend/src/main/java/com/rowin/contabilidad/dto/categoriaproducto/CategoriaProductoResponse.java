package com.rowin.contabilidad.dto.categoriaproducto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;

public record CategoriaProductoResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	Long empresaId,
	@NotBlank String nombre
) {
}
