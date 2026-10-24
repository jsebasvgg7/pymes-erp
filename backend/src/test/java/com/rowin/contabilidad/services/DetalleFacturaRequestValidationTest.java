package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DetalleFacturaRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void nullQuantityAndPriceAreRejected() {
        DetalleFacturaRequest detalle = new DetalleFacturaRequest(1L, "Item", null, null, null);

        assertEquals(2, validator.validate(detalle).size());
    }

    @Test
    void zeroQuantityIsRejected() {
        DetalleFacturaRequest detalle = new DetalleFacturaRequest(1L, "Item", BigDecimal.ZERO, BigDecimal.TEN, null);

        assertEquals(1, validator.validate(detalle).size());
    }

    @Test
    void halfQuantityIsAccepted() {
        DetalleFacturaRequest detalle = new DetalleFacturaRequest(1L, "Item", new BigDecimal("0.5"), BigDecimal.TEN, null);

        assertTrue(validator.validate(detalle).isEmpty());
    }
}
