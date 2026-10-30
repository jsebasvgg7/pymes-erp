package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.auth.LoginRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.auth.BootstrapRequest;
import com.rowin.contabilidad.dto.auth.BootstrapStatusResponse;
import com.rowin.contabilidad.dto.auth.AdminRecoveryRequest;
import com.rowin.contabilidad.dto.auth.RegisterRequest;
import com.rowin.contabilidad.exceptions.CodigoRegistroInvalidoException;
import com.rowin.contabilidad.services.AuthService;
import com.rowin.contabilidad.services.LimiteIntentosRegistro;
import com.rowin.contabilidad.dto.auth.RegistroClienteRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LimiteIntentosRegistro limiteIntentosRegistro;

    public AuthController(AuthService authService, LimiteIntentosRegistro limiteIntentosRegistro) {
        this.authService = authService;
        this.limiteIntentosRegistro = limiteIntentosRegistro;
    }

    @GetMapping("/bootstrap-status")
    public ResponseEntity<BootstrapStatusResponse> bootstrapStatus() {
        return ResponseEntity.ok(new BootstrapStatusResponse(
            authService.isInitialized(),
            authService.companyExists(),
            authService.isBootstrapAvailable()
        ));
    }

    @PostMapping("/bootstrap")
    public ResponseEntity<LoginResponse> bootstrap(@Valid @RequestBody BootstrapRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.bootstrap(request));
    }

    @PostMapping("/recover-admin")
    public ResponseEntity<LoginResponse> recoverAdmin(@Valid @RequestBody AdminRecoveryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.recoverAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/registro-cliente")
        public ResponseEntity<LoginResponse> registroClienteSaaS(
                @Valid @RequestBody RegistroClienteRequest request,
                HttpServletRequest httpRequest) {
            String origen = httpRequest.getRemoteAddr();
            limiteIntentosRegistro.verificar(origen);
            try {
                LoginResponse response = authService.registrarClienteSaaS(request);
                limiteIntentosRegistro.limpiar(origen);
                return ResponseEntity.ok(response);
            } catch (CodigoRegistroInvalidoException e) {
                limiteIntentosRegistro.registrarFallo(origen);
                throw e;
            }
        }
}
