package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.inventario.InventarioSemanalResponse;
import com.rowin.contabilidad.services.InventarioSemanalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventario-semanal")
public class InventarioSemanalController {

    private final InventarioSemanalService inventarioSemanalService;

    public InventarioSemanalController(InventarioSemanalService inventarioSemanalService) {
        this.inventarioSemanalService = inventarioSemanalService;
    }

    @GetMapping("/{empresaId}")
    public ResponseEntity<List<InventarioSemanalResponse>> historial(
        @PathVariable Long empresaId,
        @RequestParam(defaultValue = "12") int semanas
    ) {
        return ResponseEntity.ok(inventarioSemanalService.historial(empresaId, semanas));
    }
}