package com.rowin.contabilidad.dto.categoriaproducto;

import java.time.LocalDateTime;

public record CategoriaProductoResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	Long empresaId,
	String nombre
) {
}

