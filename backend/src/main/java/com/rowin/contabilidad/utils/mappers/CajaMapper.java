package com.rowin.contabilidad.utils.mappers;

import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.CajaResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.MovimientoCaja;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CajaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "nombre", source = "request.nombre")
    @Mapping(target = "saldoInicial", source = "request.saldoInicial")
    @Mapping(target = "saldoActual", source = "request.saldoInicial")
    @Mapping(target = "movimientos", ignore = true)
    Caja toEntity(CajaCreateRequest request, Empresa empresa);

    @Mapping(target = "empresaId", source = "empresa.id")
    CajaResponse toCajaResponse(Caja entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "empresa", source = "empresa")
    @Mapping(target = "caja", source = "caja")
    @Mapping(target = "formaPago", source = "formaPago")
    @Mapping(target = "fecha", ignore = true)
    @Mapping(target = "tipo", source = "request.tipo")
    @Mapping(target = "monto", source = "request.monto")
    @Mapping(target = "descripcion", source = "request.descripcion")
    @Mapping(target = "tipoReferencia", source = "request.tipoReferencia")
    @Mapping(target = "referenciaId", source = "request.referenciaId")
    MovimientoCaja toEntity(MovimientoCajaRequest request, Empresa empresa, Caja caja, FormaPago formaPago);

    @Mapping(target = "empresaId", source = "empresa.id")
    @Mapping(target = "cajaId", source = "caja.id")
    @Mapping(target = "cajaNombre", source = "caja.nombre")
    @Mapping(target = "formaPagoId", source = "formaPago.id")
    @Mapping(target = "formaPagoNombre", source = "formaPago.nombre")
    MovimientoCajaResponse toResponse(MovimientoCaja entity);

    List<MovimientoCajaResponse> toResponseList(List<MovimientoCaja> entities);
}