package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.cliente.ClienteCreateRequest;
import com.rowin.contabilidad.dto.cliente.ClienteResponse;
import com.rowin.contabilidad.dto.cliente.ClienteUpdateRequest;
import com.rowin.contabilidad.entities.Cliente;
import com.rowin.contabilidad.entities.Empresa;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ClienteMapper {

    default Cliente toEntity(ClienteCreateRequest request) {
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
    @Mapping(target = "facturas", ignore = true)
    @Mapping(target = "cuentasPorCobrar", ignore = true)
    Cliente toEntity(ClienteCreateRequest request, Empresa empresa);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "facturas", ignore = true)
    @Mapping(target = "cuentasPorCobrar", ignore = true)
    void updateEntity(ClienteUpdateRequest request, @MappingTarget Cliente entity);

    @Mapping(target = "empresaId", source = "empresa.id")
    ClienteResponse toResponse(Cliente entity);

    List<ClienteResponse> toResponseList(List<Cliente> entities);
}
