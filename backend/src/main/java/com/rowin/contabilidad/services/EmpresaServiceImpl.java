package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.EmpresaMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmpresaServiceImpl extends BaseCrudService implements EmpresaService {
	private final EmpresaRepository empresaRepository;
	private final EmpresaMapper empresaMapper;

	public EmpresaServiceImpl(EmpresaRepository empresaRepository, EmpresaMapper empresaMapper) {
		this.empresaRepository = empresaRepository;
		this.empresaMapper = empresaMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<EmpresaResponse> listar(Pageable pageable) {
		return empresaRepository.findByActiveTrue(pageable).map(empresaMapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public EmpresaResponse obtenerPorId(Long id) {
		Empresa entity = getByIdOrThrow(empresaRepository, id, "Empresa");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + id);
		}
		return empresaMapper.toResponse(entity);
	}

	@Override
	public EmpresaResponse crear(EmpresaCreateRequest request) {
		Empresa entity = empresaMapper.toEntity(request);
		Empresa saved = empresaRepository.save(entity);
		return empresaMapper.toResponse(saved);
	}

	@Override
	public EmpresaResponse actualizar(Long id, EmpresaUpdateRequest request) {
		Empresa entity = getByIdOrThrow(empresaRepository, id, "Empresa");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + id);
		}
		empresaMapper.updateEntity(request, entity);
		Empresa saved = empresaRepository.save(entity);
		return empresaMapper.toResponse(saved);
	}

	@Override
	public void eliminar(Long id) {
		Empresa entity = getByIdOrThrow(empresaRepository, id, "Empresa");
		if (!isActive(entity)) {
			return;
		}
		softDelete(entity);
		empresaRepository.save(entity);
	}
}
