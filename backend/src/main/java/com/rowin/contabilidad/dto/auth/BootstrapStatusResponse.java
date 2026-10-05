package com.rowin.contabilidad.dto.auth;

public record BootstrapStatusResponse(boolean initialized, boolean companyExists, boolean setupAvailable) {
}
