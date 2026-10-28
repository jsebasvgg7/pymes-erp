package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.pronostico.PronosticoDemandaResponse;
import com.rowin.contabilidad.services.PronosticoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pronosticos")
public class PronosticoController {

    private final PronosticoService pronosticoService;

    public PronosticoController(PronosticoService pronosticoService) {
        this.pronosticoService = pronosticoService;
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<PronosticoDemandaResponse>> obtenerPronosticos(
        @PathVariable Long empresaId
    ) {
        return ResponseEntity.ok(pronosticoService.obtenerPronosticosPorEmpresa(empresaId));
    }

    @PostMapping("/empresa/{empresaId}/recalcular")
    public ResponseEntity<Void> recalcularPronosticos(
        @PathVariable Long empresaId
    ) {
        pronosticoService.recalcularPronosticos(empresaId);
        return ResponseEntity.ok().build();
    }
}
