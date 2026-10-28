package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.usuario.UsuarioCreateRequest;
import com.rowin.contabilidad.dto.usuario.UsuarioResponse;
import com.rowin.contabilidad.dto.usuario.UsuarioUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.utils.mappers.UsuarioMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class UsuarioServiceImpl extends BaseCrudService implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final RolRepository rolRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmpresaAccesoService empresaAccesoService;

    public UsuarioServiceImpl(
        UsuarioRepository usuarioRepository,
        EmpresaRepository empresaRepository,
        RolRepository rolRepository,
        UsuarioMapper usuarioMapper,
        PasswordEncoder passwordEncoder,
        EmpresaAccesoService empresaAccesoService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.rolRepository = rolRepository;
        this.usuarioMapper = usuarioMapper;
        this.passwordEncoder = passwordEncoder;
        this.empresaAccesoService = empresaAccesoService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UsuarioResponse> listar(Pageable pageable) {
        return usuarioRepository.findByActiveTrue(pageable)
            .map(usuarioMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UsuarioResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return usuarioRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(usuarioMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        Usuario entity = usuarioRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        return usuarioMapper.toResponse(entity);
    }

    @Override
    public UsuarioResponse crear(UsuarioCreateRequest request) {
        empresaAccesoService.exigir(request.empresaId());
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        if (usuarioRepository.existsByUsernameAndActiveTrue(request.username())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso: " + request.username());
        }

        if (usuarioRepository.existsByEmailAndActiveTrue(request.email())) {
            throw new IllegalArgumentException("El email ya está registrado: " + request.email());
        }

        Usuario entity = usuarioMapper.toEntity(request, empresa);
        entity.setPasswordHash(passwordEncoder.encode(request.password()));

        if (request.rolIds() != null && !request.rolIds().isEmpty()) {
            entity.setRoles(resolverRoles(request.rolIds(), empresa.getId()));
        }

        Usuario saved = usuarioRepository.save(entity);
        return usuarioMapper.toResponse(saved);
    }

    @Override
    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request) {
        Usuario entity = usuarioRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
        Long empresaId = entity.getEmpresa().getId();
        empresaAccesoService.exigir(empresaId);

        usuarioMapper.updateEntity(request, entity);

        if (request.password() != null && !request.password().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        if (request.rolIds() != null) {
            entity.setRoles(resolverRoles(request.rolIds(), empresaId));
        }

        Usuario saved = usuarioRepository.save(entity);
        return usuarioMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        Usuario entity = usuarioRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        softDelete(entity);
        usuarioRepository.save(entity);
    }

    @Override
    public void cambiarEstado(Long id, boolean active) {
        Usuario entity = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        entity.setActive(active);
        usuarioRepository.save(entity);
    }

    private Set<Rol> resolverRoles(Set<Long> rolIds, Long empresaId) {
        Set<Rol> roles = new HashSet<>();
        for (Long rolId : rolIds) {
            Rol rol = getByIdOrThrow(rolRepository, rolId, "Rol");
            if (!isActive(rol)) {
                throw new ResourceNotFoundException("Rol no encontrado: " + rolId);
            }
            if (!rol.getEmpresa().getId().equals(empresaId)) {
                throw new IllegalArgumentException("El rol no pertenece a la empresa del usuario.");
            }
            roles.add(rol);
        }
        return roles;
    }
}
