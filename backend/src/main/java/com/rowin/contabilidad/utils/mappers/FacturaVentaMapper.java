package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.detalle.DetalleFacturaResponse;
import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaResponse;
import com.rowin.contabilidad.dto.impuesto.ImpuestoResponse;
import com.rowin.contabilidad.entities.DetalleFactura;
import com.rowin.contabilidad.entities.FacturaVenta;
import com.rowin.contabilidad.entities.Impuesto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface FacturaVentaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", ignore = true)
    @Mapping(target = "cliente", ignore = true)
    @Mapping(target = "formaPago", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "fechaEmision", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "totalImpuestos", ignore = true)
    @Mapping(target = "total", ignore = true)
    @Mapping(target = "fechaVencimiento", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "cuentaPorCobrar", ignore = true)
    FacturaVenta toEntity(FacturaVentaCreateRequest request);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "clienteId", source = "cliente.id")
    @Mapping(target = "clienteNombre", source = "cliente.nombre")
    @Mapping(target = "formaPagoId", source = "formaPago.id")
    @Mapping(target = "formaPagoNombre", source = "formaPago.nombre")
    @Mapping(target = "detalles", source = "detalles")
    FacturaVentaResponse toResponse(FacturaVenta entity);

    @Mapping(target = "productoId", source = "producto.id")
    @Mapping(target = "productoNombre", source = "producto.nombre")
    @Mapping(target = "impuestos", source = "impuestos", qualifiedByName = "toImpuestoResponseSet")
    DetalleFacturaResponse toDetalleResponse(DetalleFactura entity);

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
