package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmpresaService {
	Page<EmpresaResponse> listar(Pageable pageable);

	EmpresaResponse obtenerPorId(Long id);

	EmpresaResponse crear(EmpresaCreateRequest request);

	EmpresaResponse actualizar(Long id, EmpresaUpdateRequest request);

	void eliminar(Long id);
}
