package com.rowin.contabilidad.dto.impuesto;

import com.rowin.contabilidad.entities.TipoImpuesto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ImpuestoCreateRequest(
	@NotNull Long empresaId,
	@NotBlank @Size(max = 120) String nombre,
	@NotNull TipoImpuesto tipo,
	@NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal porcentaje
) {
}

