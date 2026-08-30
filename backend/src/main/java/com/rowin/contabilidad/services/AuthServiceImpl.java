package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.auth.LoginRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.auth.RegisterRequest;
import com.rowin.contabilidad.dto.usuario.UsuarioResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.utils.mappers.UsuarioMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;
    private final com.rowin.contabilidad.config.JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(
        AuthenticationManager authenticationManager,
        UsuarioRepository usuarioRepository,
        EmpresaRepository empresaRepository,
        RolRepository rolRepository,
        PasswordEncoder passwordEncoder,
        UsuarioMapper usuarioMapper,
        com.rowin.contabilidad.config.JwtTokenProvider jwtTokenProvider
    ) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioMapper = usuarioMapper;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtTokenProvider.generateToken(authentication);

        Usuario usuario = usuarioRepository.findByUsernameAndActiveTrue(request.username())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        UsuarioResponse usuarioResponse = usuarioMapper.toResponse(usuario);

        return new LoginResponse(token, "Bearer", usuarioResponse);
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        // Validar username único
        if (usuarioRepository.existsByUsernameAndActiveTrue(request.username())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso: " + request.username());
        }

        // Validar email único
        if (usuarioRepository.existsByEmailAndActiveTrue(request.email())) {
            throw new IllegalArgumentException("El email ya está registrado: " + request.email());
        }

        // Obtener empresa (por defecto, la primera empresa activa)
        Empresa empresa = empresaRepository.findByActiveTrue()
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("No hay empresas activas registradas"));

        // Crear usuario
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        usuario.setUsername(request.username());
        usuario.setEmail(request.email());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setActive(true);

        // Asignar roles
        if (request.rolIds() != null && !request.rolIds().isEmpty()) {
            Set<Rol> roles = new HashSet<>();
            for (Long rolId : request.rolIds()) {
                Rol rol = rolRepository.findById(rolId)
                    .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado: " + rolId));
                roles.add(rol);
            }
            usuario.setRoles(roles);
        }

        Usuario saved = usuarioRepository.save(usuario);

        // Generar token
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        String token = jwtTokenProvider.generateToken(authentication);

        UsuarioResponse usuarioResponse = usuarioMapper.toResponse(saved);

        return new LoginResponse(token, "Bearer", usuarioResponse);
    }
}
