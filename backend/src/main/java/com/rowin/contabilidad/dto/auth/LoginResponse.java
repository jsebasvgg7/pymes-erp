package com.rowin.contabilidad.dto.auth;

import com.rowin.contabilidad.dto.usuario.UsuarioResponse;

public record LoginResponse(
    String token,
    String type,
    UsuarioResponse usuario
) {
}
