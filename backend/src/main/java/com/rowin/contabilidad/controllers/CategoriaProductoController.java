package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoResponse;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import com.rowin.contabilidad.services.CategoriaProductoService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categorias-producto")
public class CategoriaProductoController {
	private final CategoriaProductoService categoriaProductoService;

	public CategoriaProductoController(CategoriaProductoService categoriaProductoService) {
		this.categoriaProductoService = categoriaProductoService;
	}

	@GetMapping("/listar")
	public ResponseEntity<Page<CategoriaProductoResponse>> listar(@ParameterObject Pageable pageable) {
		return ResponseEntity.ok(categoriaProductoService.listar(pageable));
	}

	@GetMapping("/{id}")
	public ResponseEntity<CategoriaProductoResponse> obtenerPorId(@PathVariable Long id) {
		return ResponseEntity.ok(categoriaProductoService.obtenerPorId(id));
	}

	@PostMapping("/crear")
	public ResponseEntity<CategoriaProductoResponse> crear(@Valid @RequestBody CategoriaProductoCreateRequest request) {
		CategoriaProductoResponse created = categoriaProductoService.crear(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/actualizar/{id}")
	public ResponseEntity<CategoriaProductoResponse> actualizar(
		@PathVariable Long id,
		@Valid @RequestBody CategoriaProductoUpdateRequest request
	) {
		return ResponseEntity.ok(categoriaProductoService.actualizar(id, request));
	}

	@DeleteMapping("/eliminar/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Long id) {
		categoriaProductoService.eliminar(id);
		return ResponseEntity.noContent().build();
	}
}

