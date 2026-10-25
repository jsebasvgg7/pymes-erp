package com.rowin.contabilidad.dto.rol;

import java.time.LocalDateTime;
import java.util.Set;

public record RolResponse(
		Long id,
		LocalDateTime createdAt,
		LocalDateTime updatedAt,
		boolean active,
		Long empresaId,
		String nombre,
		String descripcion,
		Set<String> modulos) {
}
