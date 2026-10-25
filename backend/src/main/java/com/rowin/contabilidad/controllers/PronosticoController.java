package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.entities.PronosticoDemanda;
import com.rowin.contabilidad.services.PronosticoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pronosticos")
public class PronosticoController {

    private final PronosticoService pronosticoService;

    public PronosticoController(PronosticoService pronosticoService) {
        this.pronosticoService = pronosticoService;
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<PronosticoDemanda>> obtenerPronosticos(@PathVariable Long empresaId) {
        return ResponseEntity.ok(pronosticoService.obtenerPronosticosPorEmpresa(empresaId));
    }

    @PostMapping("/empresa/{empresaId}/recalcular")
    public ResponseEntity<Void> recalcularPronosticos(@PathVariable Long empresaId) {
        pronosticoService.recalcularPronosticos(empresaId);
        return ResponseEntity.ok().build();
    }
}