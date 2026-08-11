package com.rowin.contabilidad.dto.impuesto;

import com.rowin.contabilidad.entities.TipoImpuesto;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ImpuestoResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	Long empresaId,
	String nombre,
	TipoImpuesto tipo,
	BigDecimal porcentaje
) {
}

