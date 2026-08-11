package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoResponse;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.CategoriaProductoRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.CategoriaProductoMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoriaProductoServiceImpl extends BaseCrudService implements CategoriaProductoService {
	private final CategoriaProductoRepository categoriaProductoRepository;
	private final EmpresaRepository empresaRepository;
	private final CategoriaProductoMapper categoriaProductoMapper;

	public CategoriaProductoServiceImpl(
		CategoriaProductoRepository categoriaProductoRepository,
		EmpresaRepository empresaRepository,
		CategoriaProductoMapper categoriaProductoMapper
	) {
		this.categoriaProductoRepository = categoriaProductoRepository;
		this.empresaRepository = empresaRepository;
		this.categoriaProductoMapper = categoriaProductoMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<CategoriaProductoResponse> listar(Pageable pageable) {
		return categoriaProductoRepository.findByActiveTrue(pageable).map(categoriaProductoMapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public CategoriaProductoResponse obtenerPorId(Long id) {
		CategoriaProducto entity = getByIdOrThrow(categoriaProductoRepository, id, "CategoriaProducto");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Categoría no encontrada: " + id);
		}
		return categoriaProductoMapper.toResponse(entity);
	}

	@Override
	public CategoriaProductoResponse crear(CategoriaProductoCreateRequest request) {
		Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
		if (!isActive(empresa)) {
			throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
		}
		CategoriaProducto entity = categoriaProductoMapper.toEntity(request, empresa);
		CategoriaProducto saved = categoriaProductoRepository.save(entity);
		return categoriaProductoMapper.toResponse(saved);
	}

	@Override
	public CategoriaProductoResponse actualizar(Long id, CategoriaProductoUpdateRequest request) {
		CategoriaProducto entity = getByIdOrThrow(categoriaProductoRepository, id, "CategoriaProducto");
		if (!isActive(entity)) {
			throw new ResourceNotFoundException("Categoría no encontrada: " + id);
		}
		categoriaProductoMapper.updateEntity(request, entity);
		CategoriaProducto saved = categoriaProductoRepository.save(entity);
		return categoriaProductoMapper.toResponse(saved);
	}

	@Override
	public void eliminar(Long id) {
		CategoriaProducto entity = getByIdOrThrow(categoriaProductoRepository, id, "CategoriaProducto");
		if (!isActive(entity)) {
			return;
		}
		softDelete(entity);
		categoriaProductoRepository.save(entity);
	}
}

