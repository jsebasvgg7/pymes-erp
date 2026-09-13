package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.rol.RolCreateRequest;
import com.rowin.contabilidad.dto.rol.RolResponse;
import com.rowin.contabilidad.dto.rol.RolUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RolMapper {
	default Rol toEntity(RolCreateRequest request) {
		return toEntity(request, null);
	}

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "active", ignore = true)
	@Mapping(target = "usuarios", ignore = true)
	@Mapping(target = "empresa", source = "empresa")
	@Mapping(target = "nombre", source = "request.nombre")
	Rol toEntity(RolCreateRequest request, Empresa empresa);

	void updateEntity(RolUpdateRequest request, @MappingTarget Rol entity);

	@Mapping(target = "empresaId", source = "empresa.id")
	RolResponse toResponse(Rol entity);

	List<RolResponse> toResponseList(List<Rol> entities);
}