package com.rowin.contabilidad.security;

import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsernameAndActiveTrue(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        Collection<? extends GrantedAuthority> authorities = usuario.getRoles()
            .stream()
            .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.getNombre().toUpperCase()))
            .collect(Collectors.toSet());

        return new User(
            usuario.getUsername(),
            usuario.getPasswordHash(),
            usuario.isActive(),
            true,
            true,
            true,
            authorities
        );
    }
}