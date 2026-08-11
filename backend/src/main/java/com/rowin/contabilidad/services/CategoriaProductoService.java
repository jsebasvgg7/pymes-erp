package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoResponse;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoriaProductoService {
	Page<CategoriaProductoResponse> listar(Pageable pageable);

	CategoriaProductoResponse obtenerPorId(Long id);

	CategoriaProductoResponse crear(CategoriaProductoCreateRequest request);

	CategoriaProductoResponse actualizar(Long id, CategoriaProductoUpdateRequest request);

	void eliminar(Long id);
}

