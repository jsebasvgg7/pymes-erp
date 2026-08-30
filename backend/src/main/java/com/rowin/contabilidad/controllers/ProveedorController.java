package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.proveedor.ProveedorCreateRequest;
import com.rowin.contabilidad.dto.proveedor.ProveedorResponse;
import com.rowin.contabilidad.dto.proveedor.ProveedorUpdateRequest;
import com.rowin.contabilidad.services.ProveedorService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping("/listar")
    public ResponseEntity<Page<ProveedorResponse>> listar(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(proveedorService.listar(pageable));
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<Page<ProveedorResponse>> listarPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(proveedorService.listarPorEmpresa(empresaId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProveedorResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(proveedorService.obtenerPorId(id));
    }

    @PostMapping("/crear")
    public ResponseEntity<ProveedorResponse> crear(@Valid @RequestBody ProveedorCreateRequest request) {
        ProveedorResponse created = proveedorService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<ProveedorResponse> actualizar(
        @PathVariable Long id,
        @Valid @RequestBody ProveedorUpdateRequest request
    ) {
        return ResponseEntity.ok(proveedorService.actualizar(id, request));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        proveedorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/eliminar-fisico/{id}")
    public ResponseEntity<Void> eliminarFisicamente(@PathVariable Long id) {
        proveedorService.eliminarFisicamente(id);
        return ResponseEntity.noContent().build();
    }
}
