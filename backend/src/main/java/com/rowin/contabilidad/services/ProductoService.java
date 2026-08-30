package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.producto.ProductoCreateRequest;
import com.rowin.contabilidad.dto.producto.ProductoResponse;
import com.rowin.contabilidad.dto.producto.ProductoUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductoService {

    Page<ProductoResponse> listar(Pageable pageable);

    Page<ProductoResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    Page<ProductoResponse> listarPorEmpresaYCategoria(Long empresaId, Long categoriaId, Pageable pageable);

    ProductoResponse obtenerPorId(Long id);

    ProductoResponse crear(ProductoCreateRequest request);

    ProductoResponse actualizar(Long id, ProductoUpdateRequest request);

    void eliminar(Long id);

    List<ProductoResponse> obtenerProductosConStockBajo(Long empresaId);

    List<ProductoResponse> obtenerProductosSinStock(Long empresaId);
}
