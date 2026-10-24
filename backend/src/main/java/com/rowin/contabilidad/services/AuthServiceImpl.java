package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.auth.LoginRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.auth.BootstrapRequest;
import com.rowin.contabilidad.dto.auth.AdminRecoveryRequest;
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

import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.dto.auth.RegistroClienteRequest;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.TipoFormaPago;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import java.util.HashSet;
import java.util.Set;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

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
    private final FormaPagoCreditoSeeder formaPagoCreditoSeeder;
    private final CajaRepository cajaRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final AperturaCajaService aperturaCajaService;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.security.admin-recovery-key:}")
    private String adminRecoveryKey;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            EmpresaRepository empresaRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder,
            UsuarioMapper usuarioMapper,
            com.rowin.contabilidad.config.JwtTokenProvider jwtTokenProvider,
            FormaPagoCreditoSeeder formaPagoCreditoSeeder,
            CajaRepository cajaRepository,
            FormaPagoRepository formaPagoRepository,
            AperturaCajaService aperturaCajaService
        ) {
            this.authenticationManager = authenticationManager;
            this.usuarioRepository = usuarioRepository;
            this.empresaRepository = empresaRepository;
            this.rolRepository = rolRepository;
            this.passwordEncoder = passwordEncoder;
            this.usuarioMapper = usuarioMapper;
            this.jwtTokenProvider = jwtTokenProvider;
            this.formaPagoCreditoSeeder = formaPagoCreditoSeeder;
            this.cajaRepository = cajaRepository;
            this.formaPagoRepository = formaPagoRepository;
            this.aperturaCajaService = aperturaCajaService;
        }

        @Override
        public LoginResponse login(LoginRequest request) {
            // Ahora usamos request.email() en lugar de request.username()
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = jwtTokenProvider.generateToken(authentication);

            Usuario usuario = usuarioRepository.findByEmailAndActiveTrue(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

            UsuarioResponse usuarioResponse = usuarioMapper.toResponse(usuario);
            return new LoginResponse(token, "Bearer", usuarioResponse);
        }

    @Override
    @Transactional(readOnly = true)
    public boolean isInitialized() {
        return usuarioRepository.existsByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBootstrapAvailable() {
        return !usuarioRepository.existsByActiveTrue() && empresaRepository.findByActiveTrue().size() <= 1;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean companyExists() {
        return empresaRepository.existsByActiveTrue();
    }

    @Override
    public LoginResponse bootstrap(BootstrapRequest request) {
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(718302650116)").getSingleResult();

        if (usuarioRepository.existsByActiveTrue()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La configuración inicial ya fue completada.");
        }

        BootstrapRequest.AdministradorData admin = request.administrador();
        String username = admin.username().trim();
        String email = admin.email().trim();
        if (usuarioRepository.existsByUsernameAndActiveTrue(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso.");
        }
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado.");
        }

        var activeCompanies = empresaRepository.findByActiveTrue();
        if (activeCompanies.size() > 1) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Hay varias empresas activas y no se puede determinar a cuál asignar el administrador inicial."
            );
        }

        Empresa savedEmpresa;
        if (activeCompanies.size() == 1) {
            savedEmpresa = activeCompanies.get(0);
        } else {
            BootstrapRequest.EmpresaData empresaData = request.empresa();
            if (empresaData.nombre() == null || empresaData.nombre().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la empresa es obligatorio.");
            }
            Empresa empresa = new Empresa();
            empresa.setNombre(empresaData.nombre().trim());
            empresa.setNit(blankToNull(empresaData.nit()));
            empresa.setDireccion(blankToNull(empresaData.direccion()));
            empresa.setTelefono(blankToNull(empresaData.telefono()));
            empresa.setEmail(blankToNull(empresaData.email()));
            savedEmpresa = empresaRepository.save(empresa);
        }

        formaPagoCreditoSeeder.sembrar(savedEmpresa);

        Rol savedRole = rolRepository.findByEmpresaIdAndNombreIgnoreCaseAndActiveTrue(savedEmpresa.getId(), "ADMIN")
            .orElseGet(() -> {
                Rol adminRole = new Rol();
                adminRole.setEmpresa(savedEmpresa);
                adminRole.setNombre("ADMIN");
                adminRole.setDescripcion("Administrador de la empresa");
                return rolRepository.save(adminRole);
            });

        Usuario usuario = new Usuario();
        usuario.setEmpresa(savedEmpresa);
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(admin.password()));
        usuario.setRoles(Set.of(savedRole));
        Usuario savedUsuario = usuarioRepository.saveAndFlush(usuario);

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(username, admin.password())
        );
        String token = jwtTokenProvider.generateToken(authentication);

        return new LoginResponse(token, "Bearer", usuarioMapper.toResponse(savedUsuario));
    }

    @Override
    public LoginResponse recoverAdmin(AdminRecoveryRequest request) {
        if (!isRecoveryKeyValid(request.recoveryKey())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La clave de recuperación no es válida o no está configurada.");
        }

        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(718302650116)").getSingleResult();
        var activeCompanies = empresaRepository.findByActiveTrue();
        if (activeCompanies.size() != 1) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                activeCompanies.isEmpty()
                    ? "No existe una empresa activa para asignar el administrador."
                    : "Hay varias empresas activas; la recuperación automática no puede elegir una."
            );
        }

        String username = request.username().trim();
        String email = request.email().trim();
        if (usuarioRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese nombre de usuario ya existe; elige otro.");
        }
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese correo ya está registrado; usa otro.");
        }

        Empresa company = activeCompanies.get(0);
        Rol adminRole = rolRepository.findByEmpresaIdAndNombreIgnoreCaseAndActiveTrue(company.getId(), "ADMIN")
            .orElseGet(() -> {
                Rol role = new Rol();
                role.setEmpresa(company);
                role.setNombre("ADMIN");
                role.setDescripcion("Administrador de la empresa");
                return rolRepository.save(role);
            });

        Usuario usuario = new Usuario();
        usuario.setEmpresa(company);
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRoles(Set.of(adminRole));
        Usuario savedUsuario = usuarioRepository.saveAndFlush(usuario);

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(username, request.password())
        );
        String token = jwtTokenProvider.generateToken(authentication);
        return new LoginResponse(token, "Bearer", usuarioMapper.toResponse(savedUsuario));
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

    @Override
    @Transactional
    public LoginResponse registrarClienteSaaS(RegistroClienteRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
               throw new IllegalArgumentException("El correo electrónico ya está registrado.");
        }

        // 2. Crear nueva Empresa
        Empresa nuevaEmpresa = new Empresa();
        nuevaEmpresa.setNombre(request.empresaNombre());
        nuevaEmpresa.setNit("PENDIENTE");
        nuevaEmpresa = empresaRepository.save(nuevaEmpresa);

        // 3. Crear Rol ADMIN para la empresa
        Rol rolAdmin = new Rol();
        rolAdmin.setNombre("ADMIN");
        rolAdmin.setEmpresa(nuevaEmpresa);
        rolAdmin = rolRepository.save(rolAdmin);

        // 4. Crear Usuario administrador vinculado
        Usuario nuevoAdmin = new Usuario();
        nuevoAdmin.setUsername(request.username());
        nuevoAdmin.setEmail(request.email());
        nuevoAdmin.setPasswordHash(passwordEncoder.encode(request.password())); // OJO: en tu entidad es setPasswordHash
        nuevoAdmin.setEmpresa(nuevaEmpresa);
        nuevoAdmin.setRoles(Set.of(rolAdmin));
        nuevoAdmin.setActive(true); // Importante activarlo
        nuevoAdmin = usuarioRepository.save(nuevoAdmin);

        // 5. Sembrar formas de pago básicas
            List<String> formasBasicas = List.of("Efectivo", "Tarjeta", "Transferencia");
            for (String nombreForma : formasBasicas) {
                FormaPago fp = new FormaPago();
                fp.setNombre(nombreForma);
                fp.setTipo(TipoFormaPago.valueOf(nombreForma.toUpperCase())); // <-- CAMBIO AQUÍ
                fp.setEmpresa(nuevaEmpresa);
                formaPagoRepository.save(fp);
            }

        // 6. Crear Caja inicial
        Caja cajaInicial = new Caja();
        cajaInicial.setNombre("Caja Principal");
        cajaInicial.setSaldoInicial(BigDecimal.ZERO);
        cajaInicial.setSaldoActual(BigDecimal.ZERO);
        cajaInicial.setEmpresa(nuevaEmpresa);
        Caja cajaGuardada = cajaRepository.save(cajaInicial);
        aperturaCajaService.abrirInicial(cajaGuardada, nuevoAdmin);

        // 7. Generar y devolver la sesión activa (LoginResponse)
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        String token = jwtTokenProvider.generateToken(authentication);

        return new LoginResponse(token, "Bearer", usuarioMapper.toResponse(nuevoAdmin));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean isRecoveryKeyValid(String suppliedKey) {
        if (adminRecoveryKey == null || adminRecoveryKey.length() < 32 || suppliedKey == null) {
            return false;
        }
        return MessageDigest.isEqual(
            adminRecoveryKey.getBytes(StandardCharsets.UTF_8),
            suppliedKey.getBytes(StandardCharsets.UTF_8)
        );
    }
}
