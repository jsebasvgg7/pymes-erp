package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.compra.CompraCreateRequest;
import com.rowin.contabilidad.dto.compra.CompraResponse;
import com.rowin.contabilidad.dto.compra.CompraUpdateRequest;
import com.rowin.contabilidad.services.CompraService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @GetMapping("/listar")
    public ResponseEntity<Page<CompraResponse>> listar(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(compraService.listar(pageable));
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<Page<CompraResponse>> listarPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(compraService.listarPorEmpresa(empresaId, pageable));
    }

    @GetMapping("/listar-por-empresa-proveedor/{empresaId}/{proveedorId}")
    public ResponseEntity<Page<CompraResponse>> listarPorEmpresaYProveedor(
        @PathVariable Long empresaId,
        @PathVariable Long proveedorId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(compraService.listarPorEmpresaYProveedor(empresaId, proveedorId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompraResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(compraService.obtenerPorId(id));
    }

    @PostMapping("/crear")
    public ResponseEntity<CompraResponse> crear(@Valid @RequestBody CompraCreateRequest request) {
        CompraResponse created = compraService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<CompraResponse> actualizar(
        @PathVariable Long id,
        @Valid @RequestBody CompraUpdateRequest request
    ) {
        return ResponseEntity.ok(compraService.actualizar(id, request));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        compraService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/por-periodo/{empresaId}")
    public ResponseEntity<List<CompraResponse>> obtenerComprasPorPeriodo(
        @PathVariable Long empresaId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return ResponseEntity.ok(compraService.obtenerComprasPorPeriodo(empresaId, inicio, fin));
    }

    @GetMapping("/total-compras-periodo/{empresaId}")
    public ResponseEntity<BigDecimal> obtenerTotalComprasPorPeriodo(
        @PathVariable Long empresaId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return ResponseEntity.ok(compraService.obtenerTotalComprasPorPeriodo(empresaId, inicio, fin));
    }
}
