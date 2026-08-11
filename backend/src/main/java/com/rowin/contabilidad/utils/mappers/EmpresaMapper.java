package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.empresa.EmpresaCreateRequest;
import com.rowin.contabilidad.dto.empresa.EmpresaResponse;
import com.rowin.contabilidad.dto.empresa.EmpresaUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EmpresaMapper {
	Empresa toEntity(EmpresaCreateRequest request);

	void updateEntity(EmpresaUpdateRequest request, @MappingTarget Empresa entity);

	EmpresaResponse toResponse(Empresa entity);

	List<EmpresaResponse> toResponseList(List<Empresa> entities);
}
