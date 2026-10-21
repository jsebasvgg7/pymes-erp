package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.auth.LoginRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.auth.BootstrapRequest;
import com.rowin.contabilidad.dto.auth.AdminRecoveryRequest;
import com.rowin.contabilidad.dto.auth.RegisterRequest;
import com.rowin.contabilidad.dto.auth.RegistroClienteRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    boolean isInitialized();

    boolean isBootstrapAvailable();

    boolean companyExists();

    LoginResponse bootstrap(BootstrapRequest request);

    LoginResponse recoverAdmin(AdminRecoveryRequest request);

    LoginResponse register(RegisterRequest request);

    LoginResponse registrarClienteSaaS(RegistroClienteRequest request);
}
