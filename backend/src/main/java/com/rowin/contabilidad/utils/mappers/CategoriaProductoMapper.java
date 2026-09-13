package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoResponse;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoriaProductoMapper {
	default CategoriaProducto toEntity(CategoriaProductoCreateRequest request) {
		return toEntity(request, null);
	}

	@Mapping(target = "nombre", source = "request.nombre")
	@Mapping(target = "empresa", source = "empresa")
	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "active", ignore = true)
	@Mapping(target = "productos", ignore = true)
	CategoriaProducto toEntity(CategoriaProductoCreateRequest request, Empresa empresa);

	void updateEntity(CategoriaProductoUpdateRequest request, @MappingTarget CategoriaProducto entity);

	@Mapping(target = "empresaId", source = "empresa.id")
	CategoriaProductoResponse toResponse(CategoriaProducto entity);

	List<CategoriaProductoResponse> toResponseList(List<CategoriaProducto> entities);
}