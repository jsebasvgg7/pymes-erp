package com.rowin.contabilidad.dto.formapago;

import com.rowin.contabilidad.entities.TipoFormaPago;
import java.time.LocalDateTime;

public record FormaPagoResponse(
	Long id,
	LocalDateTime createdAt,
	LocalDateTime updatedAt,
	boolean active,
	Long empresaId,
	String nombre,
	TipoFormaPago tipo
) {
}

