package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.dto.producto.ProductoCreateRequest;
import com.rowin.contabilidad.dto.producto.ProductoResponse;
import com.rowin.contabilidad.dto.producto.ProductoUpdateRequest;
import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Impuesto;
import com.rowin.contabilidad.entities.Producto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductoMapper {

    default Producto toEntity(ProductoCreateRequest request) {
        return toEntity(request, null, null);
    }

    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "categoria", source = "categoria")
    @Mapping(target = "sku", source = "request.sku")
    @Mapping(target = "nombre", source = "request.nombre")
    @Mapping(target = "descripcion", source = "request.descripcion")
    @Mapping(target = "unidadMedida", source = "request.unidadMedida")
    @Mapping(target = "precioVenta", source = "request.precioVenta")
    @Mapping(target = "costo", source = "request.costo")
    @Mapping(target = "stockMinimo", source = "request.stockMinimo")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "impuestos", ignore = true)
    @Mapping(target = "inventario", ignore = true)
    @Mapping(target = "detallesFactura", ignore = true)
    @Mapping(target = "detallesCompra", ignore = true)
    Producto toEntity(ProductoCreateRequest request, Empresa empresa, CategoriaProducto categoria);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "inventario", ignore = true)
    @Mapping(target = "detallesFactura", ignore = true)
    @Mapping(target = "detallesCompra", ignore = true)
    @Mapping(target = "impuestos", ignore = true)
    void updateEntity(ProductoUpdateRequest request, @MappingTarget Producto entity);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "categoriaId", source = "categoria.id")
    @Mapping(target = "categoriaNombre", source = "categoria.nombre")
    @Mapping(target = "stockActual", source = "inventario.cantidadActual")
    @Mapping(target = "costoPromedio", source = "inventario.costoPromedio")
    @Mapping(target = "impuestos", source = "impuestos", qualifiedByName = "toImpuestoResponseSet")
    ProductoResponse toResponse(Producto entity);

    @Named("toImpuestoResponseSet")
    default Set<ImpuestoResponse> toImpuestoResponseSet(Set<Impuesto> impuestos) {
        if (impuestos == null) return Set.of();
        return impuestos.stream()
            .map(i -> new ImpuestoResponse(
                i.getId(),
                i.getCreatedAt(),
                i.getUpdatedAt(),
                i.isActive(),
                i.getEmpresa().getId(),
                i.getNombre(),
                i.getTipo(),
                i.getPorcentaje()
            ))
            .collect(Collectors.toSet());
    }
}
