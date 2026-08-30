package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.producto.ProductoCreateRequest;
import com.rowin.contabilidad.dto.producto.ProductoResponse;
import com.rowin.contabilidad.dto.producto.ProductoUpdateRequest;
import com.rowin.contabilidad.services.ProductoService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping("/listar")
    public ResponseEntity<Page<ProductoResponse>> listar(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(productoService.listar(pageable));
    }

    @GetMapping("/listar-por-empresa/{empresaId}")
    public ResponseEntity<Page<ProductoResponse>> listarPorEmpresa(
        @PathVariable Long empresaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(productoService.listarPorEmpresa(empresaId, pageable));
    }

    @GetMapping("/listar-por-empresa-categoria/{empresaId}/{categoriaId}")
    public ResponseEntity<Page<ProductoResponse>> listarPorEmpresaYCategoria(
        @PathVariable Long empresaId,
        @PathVariable Long categoriaId,
        @ParameterObject Pageable pageable
    ) {
        return ResponseEntity.ok(productoService.listarPorEmpresaYCategoria(empresaId, categoriaId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @GetMapping("/stock-bajo/{empresaId}")
    public ResponseEntity<List<ProductoResponse>> obtenerProductosConStockBajo(@PathVariable Long empresaId) {
        return ResponseEntity.ok(productoService.obtenerProductosConStockBajo(empresaId));
    }

    @GetMapping("/sin-stock/{empresaId}")
    public ResponseEntity<List<ProductoResponse>> obtenerProductosSinStock(@PathVariable Long empresaId) {
        return ResponseEntity.ok(productoService.obtenerProductosSinStock(empresaId));
    }

    @PostMapping("/crear")
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoCreateRequest request) {
        ProductoResponse created = productoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<ProductoResponse> actualizar(
        @PathVariable Long id,
        @Valid @RequestBody ProductoUpdateRequest request
    ) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
