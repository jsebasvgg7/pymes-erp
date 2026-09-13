package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.inventario.AjusteStockRequest;
import com.rowin.contabilidad.dto.inventario.InventarioResponse;
import com.rowin.contabilidad.dto.inventario.MovimientoInventarioResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InventarioService {

    List<InventarioResponse> listarPorEmpresa(Long empresaId);

    InventarioResponse obtenerPorProducto(Long productoId);

    InventarioResponse ajustarStock(AjusteStockRequest request);

    List<MovimientoInventarioResponse> obtenerMovimientosPorProducto(Long productoId);

    Page<MovimientoInventarioResponse> listarMovimientosPorEmpresa(Long empresaId, Pageable pageable);
}
