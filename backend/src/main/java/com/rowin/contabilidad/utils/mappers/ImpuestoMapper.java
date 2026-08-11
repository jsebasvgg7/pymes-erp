package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.impuesto.ImpuestoCreateRequest;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Impuesto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ImpuestoMapper {
	default Impuesto toEntity(ImpuestoCreateRequest request) {
		return toEntity(request, null);
	}

	@Mapping(target = "empresa", source = "empresa")
	@Mapping(target = "nombre", source = "request.nombre")
	Impuesto toEntity(ImpuestoCreateRequest request, Empresa empresa);

	void updateEntity(ImpuestoUpdateRequest request, @MappingTarget Impuesto entity);

	@Mapping(target = "empresaId", source = "empresa.id")
	ImpuestoResponse toResponse(Impuesto entity);

	List<ImpuestoResponse> toResponseList(List<Impuesto> entities);
}
