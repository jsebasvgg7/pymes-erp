package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoResponse;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoriaProductoService {
	Page<CategoriaProductoResponse> listar(Pageable pageable);

	Page<CategoriaProductoResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

	Page<CategoriaProductoResponse> listarInactivasPorEmpresa(Long empresaId, Pageable pageable);

	CategoriaProductoResponse obtenerPorId(Long id);

	CategoriaProductoResponse crear(CategoriaProductoCreateRequest request);

	CategoriaProductoResponse actualizar(Long id, CategoriaProductoUpdateRequest request);

	CategoriaProductoResponse reactivar(Long id);

	void eliminar(Long id);
}