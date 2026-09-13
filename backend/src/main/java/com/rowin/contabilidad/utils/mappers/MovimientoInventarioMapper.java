package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.inventario.MovimientoInventarioResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.MovimientoInventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MovimientoInventarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "producto", source = "producto")
    @Mapping(target = "usuario", source = "usuario")
    @Mapping(target = "tipo", ignore = true)
    @Mapping(target = "cantidadAnterior", ignore = true)
    @Mapping(target = "cantidadNueva", ignore = true)
    @Mapping(target = "diferencia", ignore = true)
    @Mapping(target = "motivo", ignore = true)
    @Mapping(target = "notas", ignore = true)
    MovimientoInventario toEntity(Empresa empresa, Producto producto, Usuario usuario);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "productoId", source = "producto.id")
    @Mapping(target = "productoNombre", source = "producto.nombre")
    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "usuarioUsername", source = "usuario.username")
    MovimientoInventarioResponse toResponse(MovimientoInventario entity);

    List<MovimientoInventarioResponse> toResponseList(List<MovimientoInventario> entities);
}
