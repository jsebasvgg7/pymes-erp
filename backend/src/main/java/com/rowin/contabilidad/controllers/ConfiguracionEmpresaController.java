package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaResponse;
import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaUpdateRequest;
import com.rowin.contabilidad.services.ConfiguracionEmpresaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracion")
public class ConfiguracionEmpresaController {

    private final ConfiguracionEmpresaService configuracionEmpresaService;

    public ConfiguracionEmpresaController(ConfiguracionEmpresaService configuracionEmpresaService) {
        this.configuracionEmpresaService = configuracionEmpresaService;
    }

    @GetMapping("/{empresaId}")
    public ResponseEntity<ConfiguracionEmpresaResponse> obtener(
        @PathVariable Long empresaId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(configuracionEmpresaService.obtener(empresaId, authentication.getName()));
    }

    @PutMapping("/{empresaId}")
    public ResponseEntity<ConfiguracionEmpresaResponse> actualizar(
        @PathVariable Long empresaId,
        @Valid @RequestBody ConfiguracionEmpresaUpdateRequest request,
        Authentication authentication
    ) {
        return ResponseEntity.ok(configuracionEmpresaService.actualizar(empresaId, request, authentication.getName()));
    }
}
