package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.compra.CompraCreateRequest;
import com.rowin.contabilidad.dto.compra.CompraResponse;
import com.rowin.contabilidad.dto.compra.CompraUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CompraService {

    Page<CompraResponse> listar(Pageable pageable);

    Page<CompraResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    Page<CompraResponse> listarPorEmpresaYProveedor(Long empresaId, Long proveedorId, Pageable pageable);

    CompraResponse obtenerPorId(Long id);

    CompraResponse crear(CompraCreateRequest request);

    CompraResponse actualizar(Long id, CompraUpdateRequest request);

    void eliminar(Long id);

    List<CompraResponse> obtenerComprasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin);

    BigDecimal obtenerTotalComprasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin);
}
