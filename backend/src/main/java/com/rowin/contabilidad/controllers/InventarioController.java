package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.inventario.AjusteStockRequest;
import com.rowin.contabilidad.dto.inventario.InventarioResponse;
import com.rowin.contabilidad.dto.inventario.MovimientoInventarioResponse;
import com.rowin.contabilidad.services.InventarioService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private final InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<List<InventarioResponse>> listarPorEmpresa(@PathVariable Long empresaId) {
        return ResponseEntity.ok(inventarioService.listarPorEmpresa(empresaId));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<InventarioResponse> obtenerPorProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(inventarioService.obtenerPorProducto(productoId));
    }

    @PostMapping("/ajustar")
    public ResponseEntity<InventarioResponse> ajustarStock(@Valid @RequestBody AjusteStockRequest request) {
        InventarioResponse response = inventarioService.ajustarStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/movimientos/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventarioResponse>> obtenerMovimientosPorProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(inventarioService.obtenerMovimientosPorProducto(productoId));
    }

    @GetMapping("/movimientos/empresa/{empresaId}")
    public ResponseEntity<Page<MovimientoInventarioResponse>> listarMovimientosPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(inventarioService.listarMovimientosPorEmpresa(empresaId, pageable));
    }
}
