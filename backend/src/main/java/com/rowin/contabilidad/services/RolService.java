package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.rol.RolCreateRequest;
import com.rowin.contabilidad.dto.rol.RolResponse;
import com.rowin.contabilidad.dto.rol.RolUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RolService {
	Page<RolResponse> listar(Pageable pageable);

	RolResponse obtenerPorId(Long id);

	RolResponse crear(RolCreateRequest request);

	RolResponse actualizar(Long id, RolUpdateRequest request);

	void eliminar(Long id);
}
