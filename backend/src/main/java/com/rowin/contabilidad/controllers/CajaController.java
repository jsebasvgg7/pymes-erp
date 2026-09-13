package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.CajaResponse;
import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import com.rowin.contabilidad.services.CajaService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/caja")
public class CajaController {

    private final CajaService cajaService;

    public CajaController(CajaService cajaService) {
        this.cajaService = cajaService;
    }

    @PostMapping("/crear")
    public ResponseEntity<CajaResponse> crear(@Valid @RequestBody CajaCreateRequest request) {
        CajaResponse created = cajaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<List<CajaResponse>> listarCajasPorEmpresa(@PathVariable Long empresaId) {
        return ResponseEntity.ok(cajaService.listarCajasPorEmpresa(empresaId));
    }

    @GetMapping("/movimientos/listar")
    public ResponseEntity<Page<MovimientoCajaResponse>> listarMovimientos(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(cajaService.listarMovimientos(pageable));
    }

    @GetMapping("/movimientos/caja/{cajaId}")
    public ResponseEntity<Page<MovimientoCajaResponse>> listarMovimientosPorCaja(
        @PathVariable Long cajaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(cajaService.listarMovimientosPorCaja(cajaId, pageable));
    }

    @GetMapping("/movimientos/empresa/{empresaId}")
    public ResponseEntity<Page<MovimientoCajaResponse>> listarMovimientosPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(cajaService.listarMovimientosPorEmpresa(empresaId, pageable));
    }

    @PostMapping("/movimientos/registrar")
    public ResponseEntity<MovimientoCajaResponse> registrarMovimiento(@Valid @RequestBody MovimientoCajaRequest request) {
        MovimientoCajaResponse response = cajaService.registrarMovimiento(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/resumen/{cajaId}")
    public ResponseEntity<CajaResumenResponse> obtenerResumenCaja(@PathVariable Long cajaId) {
        return ResponseEntity.ok(cajaService.obtenerResumenCaja(cajaId));
    }

    @GetMapping("/resumen-todas/{empresaId}")
    public ResponseEntity<List<CajaResumenResponse>> obtenerResumenTodasCajas(@PathVariable Long empresaId) {
        return ResponseEntity.ok(cajaService.obtenerResumenTodasCajas(empresaId));
    }

    @GetMapping("/saldo/{cajaId}")
    public ResponseEntity<BigDecimal> obtenerSaldoActual(@PathVariable Long cajaId) {
        return ResponseEntity.ok(cajaService.obtenerSaldoActual(cajaId));
    }
}