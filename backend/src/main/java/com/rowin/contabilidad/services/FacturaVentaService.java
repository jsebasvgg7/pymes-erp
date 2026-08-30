package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaResponse;
import com.rowin.contabilidad.dto.factura.FacturaVentaUpdateRequest;
import com.rowin.contabilidad.entities.FacturaEstado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface FacturaVentaService {

    Page<FacturaVentaResponse> listar(Pageable pageable);

    Page<FacturaVentaResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    Page<FacturaVentaResponse> listarPorEmpresaYCliente(Long empresaId, Long clienteId, Pageable pageable);

    FacturaVentaResponse obtenerPorId(Long id);

    FacturaVentaResponse crear(FacturaVentaCreateRequest request);

    FacturaVentaResponse actualizarEstado(Long id, FacturaVentaUpdateRequest request);

    void eliminar(Long id);

    List<FacturaVentaResponse> obtenerVentasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin);

    BigDecimal obtenerTotalVentasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin);
}
