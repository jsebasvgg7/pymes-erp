package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.EmpresaMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EmpresaServiceImpl extends BaseCrudService implements EmpresaService {
	private final EmpresaRepository empresaRepository;
	private final EmpresaMapper empresaMapper;
	private final EmpresaAccesoService empresaAccesoService;

	public EmpresaServiceImpl(
		EmpresaRepository empresaRepository,
		EmpresaMapper empresaMapper,
		EmpresaAccesoService empresaAccesoService
	) {
		this.empresaRepository = empresaRepository;
		this.empresaMapper = empresaMapper;
		this.empresaAccesoService = empresaAccesoService;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<EmpresaResponse> listar(Pageable pageable) {
		Long empresaId = empresaAccesoService.empresaIdActual();
		Optional<EmpresaResponse> propia = empresaRepository.findByIdAndActiveTrue(empresaId)
			.map(empresaMapper::toResponse);
		boolean primeraPagina = pageable.isUnpaged() || pageable.getOffset() == 0;
		List<EmpresaResponse> contenido = primeraPagina ? propia.stream().toList() : List.of();
		return new PageImpl<>(contenido, pageable, propia.isPresent() ? 1 : 0);
	}

	@Override
	@Transactional(readOnly = true)
	public EmpresaResponse obtenerPorId(Long id) {
		empresaAccesoService.exigir(id);
		Empresa entity = getByIdOrThrow(empresaRepository, id, "Empresa");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + id);
		}
		return empresaMapper.toResponse(entity);
	}

	@Override
	public EmpresaResponse crear(EmpresaCreateRequest request) {
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La creación de empresas no está habilitada");
	}

	@Override
	public EmpresaResponse actualizar(Long id, EmpresaUpdateRequest request) {
		empresaAccesoService.exigir(id);
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
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La eliminación de empresas no está habilitada");
	}
}
