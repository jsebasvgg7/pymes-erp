package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaResponse;
import com.rowin.contabilidad.dto.factura.FacturaVentaUpdateRequest;
import com.rowin.contabilidad.services.FacturaVentaService;
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
@RequestMapping("/api/facturas-venta")
public class FacturaVentaController {

    private final FacturaVentaService facturaVentaService;

    public FacturaVentaController(FacturaVentaService facturaVentaService) {
        this.facturaVentaService = facturaVentaService;
    }

    @GetMapping("/listar")
    public ResponseEntity<Page<FacturaVentaResponse>> listar(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(facturaVentaService.listar(pageable));
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<Page<FacturaVentaResponse>> listarPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(facturaVentaService.listarPorEmpresa(empresaId, pageable));
    }

    @GetMapping("/listar-por-empresa-cliente/{empresaId}/{clienteId}")
    public ResponseEntity<Page<FacturaVentaResponse>> listarPorEmpresaYCliente(
        @PathVariable Long empresaId,
        @PathVariable Long clienteId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(facturaVentaService.listarPorEmpresaYCliente(empresaId, clienteId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacturaVentaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(facturaVentaService.obtenerPorId(id));
    }

    @PostMapping("/crear")
    public ResponseEntity<FacturaVentaResponse> crear(@Valid @RequestBody FacturaVentaCreateRequest request) {
        FacturaVentaResponse created = facturaVentaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/actualizar-estado/{id}")
    public ResponseEntity<FacturaVentaResponse> actualizarEstado(
        @PathVariable Long id,
        @Valid @RequestBody FacturaVentaUpdateRequest request
    ) {
        return ResponseEntity.ok(facturaVentaService.actualizarEstado(id, request));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        facturaVentaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/por-periodo/{empresaId}")
    public ResponseEntity<List<FacturaVentaResponse>> obtenerVentasPorPeriodo(
        @PathVariable Long empresaId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return ResponseEntity.ok(facturaVentaService.obtenerVentasPorPeriodo(empresaId, inicio, fin));
    }

    @GetMapping("/total-ventas-periodo/{empresaId}")
    public ResponseEntity<BigDecimal> obtenerTotalVentasPorPeriodo(
        @PathVariable Long empresaId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        return ResponseEntity.ok(facturaVentaService.obtenerTotalVentasPorPeriodo(empresaId, inicio, fin));
    }
}
