package com.rowin.contabilidad.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRecoveryRequest(
    @NotBlank @Size(min = 32, max = 256) String recoveryKey,
    @NotBlank @Size(max = 80) String username,
    @NotBlank @Email @Size(max = 150) String email,
    @NotBlank @Size(min = 8, max = 255) String password
) {
}
