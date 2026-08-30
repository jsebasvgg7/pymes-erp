package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.compra.CompraCreateRequest;
import com.rowin.contabilidad.dto.compra.CompraResponse;
import com.rowin.contabilidad.dto.detallecompra.DetalleCompraResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.entities.Compra;
import com.rowin.contabilidad.entities.DetalleCompra;
import com.rowin.contabilidad.entities.Impuesto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CompraMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "proveedor", ignore = true)
    @Mapping(target = "formaPago", ignore = true)
    @Mapping(target = "numeroDocumento", ignore = true)
    @Mapping(target = "fechaCompra", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "totalImpuestos", ignore = true)
    @Mapping(target = "total", ignore = true)
    @Mapping(target = "fechaVencimiento", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "cuentaPorPagar", ignore = true)
    Compra toEntity(CompraCreateRequest request);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "proveedorId", source = "proveedor.id")
    @Mapping(target = "proveedorNombre", source = "proveedor.nombre")
    @Mapping(target = "formaPagoId", source = "formaPago.id")
    @Mapping(target = "formaPagoNombre", source = "formaPago.nombre")
    @Mapping(target = "detalles", source = "detalles")
    CompraResponse toResponse(Compra entity);

    @Mapping(target = "productoId", source = "producto.id")
    @Mapping(target = "productoNombre", source = "producto.nombre")
    @Mapping(target = "impuestos", source = "impuestos", qualifiedByName = "toImpuestoResponseSet")
    DetalleCompraResponse toDetalleResponse(DetalleCompra entity);

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
