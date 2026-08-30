package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.usuario.UsuarioCreateRequest;
import com.rowin.contabilidad.dto.usuario.UsuarioResponse;
import com.rowin.contabilidad.dto.usuario.UsuarioUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", uses = {RolMapper.class})
public interface UsuarioMapper {

    default Usuario toEntity(UsuarioCreateRequest request) {
        return toEntity(request, null);
    }

    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "username", source = "request.username")
    @Mapping(target = "email", source = "request.email")
    @Mapping(target = "passwordHash", ignore = true)  // Se encripta en el servicio
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "roles", ignore = true)
    Usuario toEntity(UsuarioCreateRequest request, Empresa empresa);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "roles", ignore = true)
    void updateEntity(UsuarioUpdateRequest request, @MappingTarget Usuario entity);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "roles", source = "roles")
    UsuarioResponse toResponse(Usuario entity);

    List<UsuarioResponse> toResponseList(List<Usuario> entities);
}
