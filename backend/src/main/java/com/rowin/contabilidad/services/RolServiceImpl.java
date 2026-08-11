package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.rol.RolCreateRequest;
import com.rowin.contabilidad.dto.rol.RolResponse;
import com.rowin.contabilidad.dto.rol.RolUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.utils.mappers.RolMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RolServiceImpl extends BaseCrudService implements RolService {
	private final RolRepository rolRepository;
	private final EmpresaRepository empresaRepository;
	private final RolMapper rolMapper;

	public RolServiceImpl(RolRepository rolRepository, EmpresaRepository empresaRepository, RolMapper rolMapper) {
		this.rolRepository = rolRepository;
		this.empresaRepository = empresaRepository;
		this.rolMapper = rolMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<RolResponse> listar(Pageable pageable) {
		return rolRepository.findByActiveTrue(pageable).map(rolMapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public RolResponse obtenerPorId(Long id) {
		Rol entity = getByIdOrThrow(rolRepository, id, "Rol");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Rol no encontrado: " + id);
		}
		return rolMapper.toResponse(entity);
	}

	@Override
	public RolResponse crear(RolCreateRequest request) {
		Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
		if (!isActive(empresa)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
		}
		Rol entity = rolMapper.toEntity(request, empresa);
		Rol saved = rolRepository.save(entity);
		return rolMapper.toResponse(saved);
	}

	@Override
	public RolResponse actualizar(Long id, RolUpdateRequest request) {
		Rol entity = getByIdOrThrow(rolRepository, id, "Rol");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Rol no encontrado: " + id);
		}
		rolMapper.updateEntity(request, entity);
		Rol saved = rolRepository.save(entity);
		return rolMapper.toResponse(saved);
	}

	@Override
	public void eliminar(Long id) {
		Rol entity = getByIdOrThrow(rolRepository, id, "Rol");
		if (!isActive(entity)) {
			return;
		}
		softDelete(entity);
		rolRepository.save(entity);
	}
}
