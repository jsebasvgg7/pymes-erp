package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.impuesto.ImpuestoCreateRequest;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ImpuestoService {
	Page<ImpuestoResponse> listar(Pageable pageable);

	ImpuestoResponse obtenerPorId(Long id);

	ImpuestoResponse crear(ImpuestoCreateRequest request);

	ImpuestoResponse actualizar(Long id, ImpuestoUpdateRequest request);

	void eliminar(Long id);
}
