package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmpresaAccesoService {

    private final UsuarioRepository usuarioRepository;

    public EmpresaAccesoService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public void exigir(Long empresaId) {
        Long empresaDelUsuario = empresaDelUsuarioAutenticado();
        if (empresaId == null || empresaDelUsuario == null || !empresaDelUsuario.equals(empresaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a los datos de esta empresa");
        }
    }

    public Long empresaIdActual() {
        Long empresaDelUsuario = empresaDelUsuarioAutenticado();
        if (empresaDelUsuario == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a los datos de esta empresa");
        }
        return empresaDelUsuario;
    }

    private Long empresaDelUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
            || authentication instanceof AnonymousAuthenticationToken
            || !authentication.isAuthenticated()) {
            return null;
        }
        return usuarioRepository.findByEmailAndActiveTrue(authentication.getName())
            .map(Usuario::getEmpresa)
            .map(Empresa::getId)
            .orElse(null);
    }
}
