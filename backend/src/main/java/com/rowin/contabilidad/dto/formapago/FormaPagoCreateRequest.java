package com.rowin.contabilidad.dto.formapago;

import com.rowin.contabilidad.entities.TipoFormaPago;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FormaPagoCreateRequest(
	@NotNull Long empresaId,
	@NotBlank @Size(max = 120) String nombre,
	@NotNull TipoFormaPago tipo
) {
}

