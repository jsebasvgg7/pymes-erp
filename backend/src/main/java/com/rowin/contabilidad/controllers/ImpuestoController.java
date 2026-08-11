package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.impuesto.ImpuestoCreateRequest;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoUpdateRequest;
import com.rowin.contabilidad.exceptions.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
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
@RequestMapping("/api/impuestos")
public class ImpuestoController {
	private static ApiErrorResponse disabled(HttpServletRequest request) {
		return new ApiErrorResponse(
			LocalDateTime.now(),
			HttpStatus.NOT_IMPLEMENTED.value(),
			HttpStatus.NOT_IMPLEMENTED.getReasonPhrase(),
			"El módulo de Impuestos no está disponible en la primera versión del ERP.",
			request.getRequestURI(),
			null
		);
	}

	@GetMapping("/listar")
	public ResponseEntity<ApiErrorResponse> listar(@ParameterObject Pageable pageable, HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(disabled(request));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiErrorResponse> obtenerPorId(@PathVariable Long id, HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(disabled(request));
	}

	@PostMapping("/crear")
	public ResponseEntity<ApiErrorResponse> crear(@Valid @RequestBody ImpuestoCreateRequest request, HttpServletRequest servletRequest) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(disabled(servletRequest));
	}

	@PutMapping("/actualizar/{id}")
	public ResponseEntity<ApiErrorResponse> actualizar(
		@PathVariable Long id,
		@Valid @RequestBody ImpuestoUpdateRequest request,
		HttpServletRequest servletRequest
	) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(disabled(servletRequest));
	}

	@DeleteMapping("/eliminar/{id}")
	public ResponseEntity<ApiErrorResponse> eliminar(@PathVariable Long id, HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(disabled(request));
	}
}
