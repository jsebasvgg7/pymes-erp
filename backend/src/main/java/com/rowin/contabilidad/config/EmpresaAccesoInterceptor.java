package com.rowin.contabilidad.config;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Component
public class EmpresaAccesoInterceptor implements HandlerInterceptor {

    static final String VARIABLE_EMPRESA = "empresaId";

    private final UsuarioRepository usuarioRepository;

    public EmpresaAccesoInterceptor(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @SuppressWarnings("unchecked")
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Map<String, String> variables =
            (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (variables == null || !variables.containsKey(VARIABLE_EMPRESA)) {
            return true;
        }

        Long empresaSolicitada = leerEmpresaId(variables.get(VARIABLE_EMPRESA));
        Long empresaDelUsuario = empresaDelUsuarioAutenticado();

        if (empresaDelUsuario == null || !empresaDelUsuario.equals(empresaSolicitada)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a los datos de esta empresa");
        }
        return true;
    }

    private Long leerEmpresaId(String valor) {
        try {
            return Long.valueOf(valor);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El identificador de la empresa no es válido");
        }
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
