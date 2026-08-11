package com.rowin.contabilidad.dto.empresa;

import java.time.LocalDateTime;

public record EmpresaResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	String nombre,
	String nit,
	String direccion,
	String telefono,
	String email
) {
}

