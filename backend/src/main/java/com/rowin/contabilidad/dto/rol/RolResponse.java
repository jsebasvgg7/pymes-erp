package com.rowin.contabilidad.dto.rol;

import java.time.LocalDateTime;

public record RolResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	Long empresaId,
	String nombre,
	String descripcion
) {
}

