package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.formapago.FormaPagoCreateRequest;
import com.rowin.contabilidad.dto.formapago.FormaPagoResponse;
import com.rowin.contabilidad.dto.formapago.FormaPagoUpdateRequest;
import com.rowin.contabilidad.services.FormaPagoService;
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
@RequestMapping("/api/formas-pago")
public class FormaPagoController {
	private final FormaPagoService formaPagoService;

	public FormaPagoController(FormaPagoService formaPagoService) {
		this.formaPagoService = formaPagoService;
	}

	@GetMapping("/listar")
	public ResponseEntity<Page<FormaPagoResponse>> listar(@ParameterObject Pageable pageable) {
		return ResponseEntity.ok(formaPagoService.listar(pageable));
	}

	@GetMapping("/{id}")
	public ResponseEntity<FormaPagoResponse> obtenerPorId(@PathVariable Long id) {
		return ResponseEntity.ok(formaPagoService.obtenerPorId(id));
	}

	@PostMapping("/crear")
	public ResponseEntity<FormaPagoResponse> crear(@Valid @RequestBody FormaPagoCreateRequest request) {
		FormaPagoResponse created = formaPagoService.crear(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/actualizar/{id}")
	public ResponseEntity<FormaPagoResponse> actualizar(@PathVariable Long id, @Valid @RequestBody FormaPagoUpdateRequest request) {
		return ResponseEntity.ok(formaPagoService.actualizar(id, request));
	}

	@DeleteMapping("/eliminar/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Long id) {
		formaPagoService.eliminar(id);
		return ResponseEntity.noContent().build();
	}
}
