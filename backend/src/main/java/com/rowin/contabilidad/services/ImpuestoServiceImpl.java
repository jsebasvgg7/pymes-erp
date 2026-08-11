package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.impuesto.ImpuestoCreateRequest;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Impuesto;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ImpuestoRepository;
import com.rowin.contabilidad.utils.mappers.ImpuestoMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ImpuestoServiceImpl extends BaseCrudService implements ImpuestoService {
	private final ImpuestoRepository impuestoRepository;
	private final EmpresaRepository empresaRepository;
	private final ImpuestoMapper impuestoMapper;

	public ImpuestoServiceImpl(
		ImpuestoRepository impuestoRepository,
		EmpresaRepository empresaRepository,
		ImpuestoMapper impuestoMapper
	) {
		this.impuestoRepository = impuestoRepository;
		this.empresaRepository = empresaRepository;
		this.impuestoMapper = impuestoMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<ImpuestoResponse> listar(Pageable pageable) {
		return impuestoRepository.findByActiveTrue(pageable).map(impuestoMapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public ImpuestoResponse obtenerPorId(Long id) {
		Impuesto entity = getByIdOrThrow(impuestoRepository, id, "Impuesto");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Impuesto no encontrado: " + id);
		}
		return impuestoMapper.toResponse(entity);
	}

	@Override
	public ImpuestoResponse crear(ImpuestoCreateRequest request) {
		Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
		if (!isActive(empresa)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
		}
		Impuesto entity = impuestoMapper.toEntity(request, empresa);
		Impuesto saved = impuestoRepository.save(entity);
		return impuestoMapper.toResponse(saved);
	}

	@Override
	public ImpuestoResponse actualizar(Long id, ImpuestoUpdateRequest request) {
		Impuesto entity = getByIdOrThrow(impuestoRepository, id, "Impuesto");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Impuesto no encontrado: " + id);
		}
		impuestoMapper.updateEntity(request, entity);
		Impuesto saved = impuestoRepository.save(entity);
		return impuestoMapper.toResponse(saved);
	}

	@Override
	public void eliminar(Long id) {
		Impuesto entity = getByIdOrThrow(impuestoRepository, id, "Impuesto");
		if (!isActive(entity)) {
			return;
		}
		softDelete(entity);
		impuestoRepository.save(entity);
	}
}
