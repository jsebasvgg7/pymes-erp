package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.formapago.FormaPagoCreateRequest;
import com.rowin.contabilidad.dto.formapago.FormaPagoResponse;
import com.rowin.contabilidad.dto.formapago.FormaPagoUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FormaPagoService {
	Page<FormaPagoResponse> listar(Pageable pageable);

	FormaPagoResponse obtenerPorId(Long id);

	FormaPagoResponse crear(FormaPagoCreateRequest request);

	FormaPagoResponse actualizar(Long id, FormaPagoUpdateRequest request);

	void eliminar(Long id);
}
