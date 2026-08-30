package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.proveedor.ProveedorCreateRequest;
import com.rowin.contabilidad.dto.proveedor.ProveedorResponse;
import com.rowin.contabilidad.dto.proveedor.ProveedorUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProveedorService {

    Page<ProveedorResponse> listar(Pageable pageable);

    Page<ProveedorResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    ProveedorResponse obtenerPorId(Long id);

    ProveedorResponse crear(ProveedorCreateRequest request);

    ProveedorResponse actualizar(Long id, ProveedorUpdateRequest request);

    void eliminar(Long id);

    void eliminarFisicamente(Long id);
}
