package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.formapago.FormaPagoCreateRequest;
import com.rowin.contabilidad.dto.formapago.FormaPagoResponse;
import com.rowin.contabilidad.dto.formapago.FormaPagoUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FormaPagoMapper {
	default FormaPago toEntity(FormaPagoCreateRequest request) {
		return toEntity(request, null);
	}

	@Mapping(target = "empresa", source = "empresa")
	@Mapping(target = "nombre", source = "request.nombre")
	FormaPago toEntity(FormaPagoCreateRequest request, Empresa empresa);

	void updateEntity(FormaPagoUpdateRequest request, @MappingTarget FormaPago entity);

	@Mapping(target = "empresaId", source = "empresa.id")
	FormaPagoResponse toResponse(FormaPago entity);

	List<FormaPagoResponse> toResponseList(List<FormaPago> entities);
}
