package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.usuario.UsuarioCreateRequest;
import com.rowin.contabilidad.dto.usuario.UsuarioResponse;
import com.rowin.contabilidad.dto.usuario.UsuarioUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UsuarioService {

    Page<UsuarioResponse> listar(Pageable pageable);

    Page<UsuarioResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    UsuarioResponse obtenerPorId(Long id);

    UsuarioResponse crear(UsuarioCreateRequest request);

    UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request);

    void eliminar(Long id);

    void cambiarEstado(Long id, boolean active);
}
