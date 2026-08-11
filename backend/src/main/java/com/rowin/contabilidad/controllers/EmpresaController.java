package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import com.rowin.contabilidad.services.EmpresaService;
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
@RequestMapping("/api/empresas")
public class EmpresaController {
	private final EmpresaService empresaService;

	public EmpresaController(EmpresaService empresaService) {
		this.empresaService = empresaService;
	}

	@GetMapping("/listar")
	public ResponseEntity<Page<EmpresaResponse>> listar(@ParameterObject Pageable pageable) {
		return ResponseEntity.ok(empresaService.listar(pageable));
	}

	@GetMapping("/{id}")
	public ResponseEntity<EmpresaResponse> obtenerPorId(@PathVariable Long id) {
		return ResponseEntity.ok(empresaService.obtenerPorId(id));
	}

	@PostMapping("/crear")
	public ResponseEntity<EmpresaResponse> crear(@Valid @RequestBody EmpresaCreateRequest request) {
		EmpresaResponse created = empresaService.crear(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/actualizar/{id}")
	public ResponseEntity<EmpresaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody EmpresaUpdateRequest request) {
		return ResponseEntity.ok(empresaService.actualizar(id, request));
	}

	@DeleteMapping("/eliminar/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Long id) {
		empresaService.eliminar(id);
		return ResponseEntity.noContent().build();
	}
}
