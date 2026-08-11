package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.rol.RolCreateRequest;
import com.rowin.contabilidad.dto.rol.RolResponse;
import com.rowin.contabilidad.dto.rol.RolUpdateRequest;
import com.rowin.contabilidad.services.RolService;
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
@RequestMapping("/api/roles")
public class RolController {
	private final RolService rolService;

	public RolController(RolService rolService) {
		this.rolService = rolService;
	}

	@GetMapping("/listar")
	public ResponseEntity<Page<RolResponse>> listar(@ParameterObject Pageable pageable) {
		return ResponseEntity.ok(rolService.listar(pageable));
	}

	@GetMapping("/{id}")
	public ResponseEntity<RolResponse> obtenerPorId(@PathVariable Long id) {
		return ResponseEntity.ok(rolService.obtenerPorId(id));
	}

	@PostMapping("/crear")
	public ResponseEntity<RolResponse> crear(@Valid @RequestBody RolCreateRequest request) {
		RolResponse created = rolService.crear(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/actualizar/{id}")
	public ResponseEntity<RolResponse> actualizar(@PathVariable Long id, @Valid @RequestBody RolUpdateRequest request) {
		return ResponseEntity.ok(rolService.actualizar(id, request));
	}

	@DeleteMapping("/eliminar/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Long id) {
		rolService.eliminar(id);
		return ResponseEntity.noContent().build();
	}
}
