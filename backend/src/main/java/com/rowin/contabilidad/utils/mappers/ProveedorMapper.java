package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.proveedor.ProveedorCreateRequest;
import com.rowin.contabilidad.dto.proveedor.ProveedorResponse;
import com.rowin.contabilidad.dto.proveedor.ProveedorUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Proveedor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProveedorMapper {

    default Proveedor toEntity(ProveedorCreateRequest request) {
        return toEntity(request, null);
    }

    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "nombre", source = "request.nombre")
    @Mapping(target = "documento", source = "request.documento")
    @Mapping(target = "telefono", source = "request.telefono")
    @Mapping(target = "email", source = "request.email")
    @Mapping(target = "direccion", source = "request.direccion")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "compras", ignore = true)
    @Mapping(target = "cuentasPorPagar", ignore = true)
    Proveedor toEntity(ProveedorCreateRequest request, Empresa empresa);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "compras", ignore = true)
    @Mapping(target = "cuentasPorPagar", ignore = true)
    void updateEntity(ProveedorUpdateRequest request, @MappingTarget Proveedor entity);

    @Mapping(target = "empresaId", source = "empresa.id")
    ProveedorResponse toResponse(Proveedor entity);

    List<ProveedorResponse> toResponseList(List<Proveedor> entities);
}
