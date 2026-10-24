package com.rowin.contabilidad.dto.configuracion;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ConfiguracionEmpresaUpdateRequest(
    @Pattern(regexp = "^[A-Z]{3}$", message = "La moneda debe ser un código de 3 letras mayúsculas") String moneda,
    @Pattern(regexp = "^\\S{1,5}$", message = "El símbolo debe tener entre 1 y 5 caracteres sin espacios") String simboloMoneda,
    @Pattern(regexp = "^(DD/MM/AAAA|MM/DD/AAAA|AAAA-MM-DD)$", message = "El formato de fecha no es válido") String formatoFecha,
    Boolean clienteObligatorio,
    @Min(value = 1, message = "El vencimiento del crédito debe ser de al menos 1 día")
    @Max(value = 365, message = "El vencimiento del crédito no puede superar 365 días") Integer diasVencimientoCredito,
    Boolean codigoBarrasActivo,
    @DecimalMin(value = "0", message = "El stock mínimo no puede ser negativo")
    @Digits(integer = 16, fraction = 3, message = "El stock mínimo admite hasta 3 decimales") BigDecimal stockMinimoDefecto,
    Boolean avisarStockBajo,
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora debe tener el formato HH:mm") String horaCierreAutomatico,
    Integer anchoRecibo,
    @Size(max = 150, message = "El nombre del recibo admite hasta 150 caracteres") String nombreRecibo,
    @Size(max = 255, message = "El mensaje al pie admite hasta 255 caracteres") String mensajePieRecibo
) {
}
