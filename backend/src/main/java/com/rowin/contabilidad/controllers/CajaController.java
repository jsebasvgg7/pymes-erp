package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.caja.AperturaCajaRequest;
import com.rowin.contabilidad.dto.caja.AperturaCajaResponse;
import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.CajaResponse;
import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.dto.caja.CierreCajaRequest;
import com.rowin.contabilidad.dto.caja.CierreCajaResponse;
import com.rowin.contabilidad.dto.caja.EstadoCajaResponse;
import com.rowin.contabilidad.dto.caja.FlujoCajaDiarioResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import com.rowin.contabilidad.services.AperturaCajaService;
import com.rowin.contabilidad.services.CajaService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/caja")
public class CajaController {

    private final CajaService cajaService;
    private final AperturaCajaService aperturaCajaService;

    public CajaController(CajaService cajaService, AperturaCajaService aperturaCajaService) {
        this.cajaService = cajaService;
        this.aperturaCajaService = aperturaCajaService;
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

    @GetMapping("/estados/{empresaId}")
    public ResponseEntity<List<EstadoCajaResponse>> estados(
        @PathVariable Long empresaId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(aperturaCajaService.estados(empresaId, authentication.getName()));
    }

    @GetMapping("/estado/{cajaId}")
    public ResponseEntity<EstadoCajaResponse> estado(
        @PathVariable Long cajaId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(aperturaCajaService.estado(cajaId, authentication.getName()));
    }

    @PostMapping("/abrir/{cajaId}")
    public ResponseEntity<AperturaCajaResponse> abrir(
        @PathVariable Long cajaId,
        @Valid @RequestBody AperturaCajaRequest request,
        Authentication authentication
    ) {
        AperturaCajaResponse response = aperturaCajaService.abrir(cajaId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/cerrar/{cajaId}")
    public ResponseEntity<CierreCajaResponse> cerrar(
        @PathVariable Long cajaId,
        @Valid @RequestBody CierreCajaRequest request,
        Authentication authentication
    ) {
        return ResponseEntity.ok(aperturaCajaService.cerrar(cajaId, request, authentication.getName()));
    }

    @PostMapping("/reabrir/{cajaId}")
    public ResponseEntity<AperturaCajaResponse> reabrir(
        @PathVariable Long cajaId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(aperturaCajaService.reabrir(cajaId, authentication.getName()));
    }

    @GetMapping("/cierres/{cajaId}")
    public ResponseEntity<Page<AperturaCajaResponse>> historialCierres(
        @PathVariable Long cajaId,
        @ParameterObject Pageable pageable,
        Authentication authentication
    ) {
        return ResponseEntity.ok(aperturaCajaService.historial(cajaId, pageable, authentication.getName()));
    }

    @GetMapping("/movimientos/flujo-diario/{empresaId}")
    public ResponseEntity<List<FlujoCajaDiarioResponse>> obtenerFlujoCajaDiario(
        @PathVariable Long empresaId,
        @RequestParam(required = false) Integer mesesAtras
    ) {
        return ResponseEntity.ok(cajaService.obtenerFlujoCajaDiario(empresaId, mesesAtras));
    }
}