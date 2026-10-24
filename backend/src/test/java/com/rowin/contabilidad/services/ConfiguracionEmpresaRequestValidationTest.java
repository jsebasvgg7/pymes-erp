package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaUpdateRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConfiguracionEmpresaRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private ConfiguracionEmpresaUpdateRequest request(
        String moneda, String simbolo, String formatoFecha, Integer dias, BigDecimal stock, String hora
    ) {
        return new ConfiguracionEmpresaUpdateRequest(
            moneda, simbolo, formatoFecha, null, dias, null, stock, null, hora, null, null, null);
    }

    @Test
    void emptyRequestIsAccepted() {
        assertTrue(validator.validate(request(null, null, null, null, null, null)).isEmpty());
    }

    @Test
    void validValuesAreAccepted() {
        assertTrue(validator.validate(
            request("COP", "$", "MM/DD/AAAA", 45, new BigDecimal("2.5"), "23:30")).isEmpty());
    }

    @Test
    void invalidCurrencyCodeIsRejected() {
        assertEquals(1, validator.validate(request("cop", null, null, null, null, null)).size());
    }

    @Test
    void symbolWithSpacesOrTooLongIsRejected() {
        assertEquals(1, validator.validate(request(null, "$ $", null, null, null, null)).size());
        assertEquals(1, validator.validate(request(null, "ABCDEF", null, null, null, null)).size());
    }

    @Test
    void unknownDateFormatIsRejected() {
        assertEquals(1, validator.validate(request(null, null, "YYYY", null, null, null)).size());
    }

    @Test
    void creditDaysOutOfRangeAreRejected() {
        assertEquals(1, validator.validate(request(null, null, null, 0, null, null)).size());
        assertEquals(1, validator.validate(request(null, null, null, 366, null, null)).size());
    }

    @Test
    void negativeOrTooPreciseStockIsRejected() {
        assertEquals(1, validator.validate(request(null, null, null, null, new BigDecimal("-1"), null)).size());
        assertEquals(1, validator.validate(request(null, null, null, null, new BigDecimal("1.2345"), null)).size());
    }

    @Test
    void invalidTimeIsRejected() {
        assertEquals(1, validator.validate(request(null, null, null, null, null, "24:00")).size());
        assertEquals(1, validator.validate(request(null, null, null, null, null, "4:00")).size());
    }
}
