package com.rowin.contabilidad.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderTest {

    private JwtTokenProvider proveedorConSecreto(String secreto) {
        JwtTokenProvider proveedor = new JwtTokenProvider();
        ReflectionTestUtils.setField(proveedor, "jwtSecret", secreto);
        return proveedor;
    }

    @Test
    void rechazaUnSecretoCorto() {
        JwtTokenProvider proveedor = proveedorConSecreto("corto");

        assertThrows(IllegalStateException.class, proveedor::validarSecreto);
    }

    @Test
    void rechazaUnSecretoAusente() {
        JwtTokenProvider proveedor = proveedorConSecreto(null);

        assertThrows(IllegalStateException.class, proveedor::validarSecreto);
    }

    @Test
    void aceptaUnSecretoDe32CaracteresOMas() {
        JwtTokenProvider proveedor = proveedorConSecreto("a".repeat(32));

        assertDoesNotThrow(proveedor::validarSecreto);
    }
}
