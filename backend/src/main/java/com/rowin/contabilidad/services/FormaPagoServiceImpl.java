package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.formapago.FormaPagoCreateRequest;
import com.rowin.contabilidad.dto.formapago.FormaPagoResponse;
import com.rowin.contabilidad.dto.formapago.FormaPagoUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.utils.mappers.FormaPagoMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FormaPagoServiceImpl extends BaseCrudService implements FormaPagoService {
	private final FormaPagoRepository formaPagoRepository;
	private final EmpresaRepository empresaRepository;
	private final FormaPagoMapper formaPagoMapper;

	public FormaPagoServiceImpl(
		FormaPagoRepository formaPagoRepository,
		EmpresaRepository empresaRepository,
		FormaPagoMapper formaPagoMapper
	) {
		this.formaPagoRepository = formaPagoRepository;
		this.empresaRepository = empresaRepository;
		this.formaPagoMapper = formaPagoMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<FormaPagoResponse> listar(Pageable pageable) {
		return formaPagoRepository.findByActiveTrue(pageable).map(formaPagoMapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public FormaPagoResponse obtenerPorId(Long id) {
		FormaPago entity = getByIdOrThrow(formaPagoRepository, id, "Forma de pago");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Forma de pago no encontrada: " + id);
		}
		return formaPagoMapper.toResponse(entity);
	}

	@Override
	public FormaPagoResponse crear(FormaPagoCreateRequest request) {
		Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
		if (!isActive(empresa)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
		}
		FormaPago entity = formaPagoMapper.toEntity(request, empresa);
		FormaPago saved = formaPagoRepository.save(entity);
		return formaPagoMapper.toResponse(saved);
	}

	@Override
	public FormaPagoResponse actualizar(Long id, FormaPagoUpdateRequest request) {
		FormaPago entity = getByIdOrThrow(formaPagoRepository, id, "Forma de pago");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Forma de pago no encontrada: " + id);
		}
		formaPagoMapper.updateEntity(request, entity);
		FormaPago saved = formaPagoRepository.save(entity);
		return formaPagoMapper.toResponse(saved);
	}

	@Override
	public void eliminar(Long id) {
		FormaPago entity = getByIdOrThrow(formaPagoRepository, id, "Forma de pago");
		if (!isActive(entity)) {
			return;
		}
		softDelete(entity);
		formaPagoRepository.save(entity);
	}
}
