package com.rowin.contabilidad.services;

import com.rowin.contabilidad.config.JwtTokenProvider;
import com.rowin.contabilidad.dto.auth.AdminRecoveryRequest;
import com.rowin.contabilidad.dto.auth.BootstrapRequest;
import com.rowin.contabilidad.dto.auth.LoginResponse;
import com.rowin.contabilidad.dto.usuario.UsuarioResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Rol;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.RolRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.utils.mappers.UsuarioMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private RolRepository rolRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UsuarioMapper usuarioMapper;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EntityManager entityManager;
    @Mock private Query lockQuery;
    @Mock private Authentication authentication;

    @InjectMocks private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "entityManager", entityManager);
    }

    private void stubSetupLock() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(lockQuery);
        when(lockQuery.getSingleResult()).thenReturn(1);
    }

    @Test
    void bootstrapCreatesCompanyAdministratorAndReturnsToken() {
        stubSetupLock();
        BootstrapRequest request = new BootstrapRequest(
            new BootstrapRequest.EmpresaData("Mi negocio", "", "", "", ""),
            new BootstrapRequest.AdministradorData("admin", "admin@example.com", "ClaveSegura123")
        );
        UsuarioResponse usuarioResponse = new UsuarioResponse(
            1L, null, null, true, 1L, "admin", "admin@example.com", java.util.Set.of()
        );

        when(usuarioRepository.existsByUsernameAndActiveTrue("admin")).thenReturn(false);
        when(usuarioRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rolRepository.save(any(Rol.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode("ClaveSegura123")).thenReturn("encoded-password");
        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token");
        when(usuarioMapper.toResponse(any(Usuario.class))).thenReturn(usuarioResponse);

        LoginResponse response = authService.bootstrap(request);

        assertEquals("jwt-token", response.token());
        verify(empresaRepository).save(any(Empresa.class));
        verify(rolRepository).save(any(Rol.class));
        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).saveAndFlush(usuarioCaptor.capture());
        Usuario savedUsuario = usuarioCaptor.getValue();
        assertEquals("admin", savedUsuario.getUsername());
        assertEquals("encoded-password", savedUsuario.getPasswordHash());
        assertEquals("ADMIN", savedUsuario.getRoles().iterator().next().getNombre());
    }

    @Test
    void bootstrapRejectsWhenAnActiveUserAlreadyExists() {
        stubSetupLock();
        when(usuarioRepository.existsByActiveTrue()).thenReturn(true);
        BootstrapRequest request = new BootstrapRequest(
            new BootstrapRequest.EmpresaData("Mi negocio", null, null, null, null),
            new BootstrapRequest.AdministradorData("admin", "admin@example.com", "ClaveSegura123")
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> authService.bootstrap(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void bootstrapReusesTheOnlyActiveCompany() {
        stubSetupLock();
        Empresa company = new Empresa();
        company.setId(7L);
        BootstrapRequest request = new BootstrapRequest(
            new BootstrapRequest.EmpresaData(null, null, null, null, null),
            new BootstrapRequest.AdministradorData("admin", "admin@example.com", "ClaveSegura123")
        );

        when(usuarioRepository.existsByActiveTrue()).thenReturn(false);
        when(usuarioRepository.existsByUsernameAndActiveTrue("admin")).thenReturn(false);
        when(usuarioRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(empresaRepository.findByActiveTrue()).thenReturn(java.util.List.of(company));
        when(rolRepository.save(any(Rol.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode("ClaveSegura123")).thenReturn("encoded-password");
        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token");
        when(usuarioMapper.toResponse(any(Usuario.class))).thenReturn(
            new UsuarioResponse(1L, null, null, true, 7L, "admin", "admin@example.com", java.util.Set.of())
        );

        authService.bootstrap(request);

        verify(empresaRepository, never()).save(any(Empresa.class));
        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).saveAndFlush(usuarioCaptor.capture());
        assertEquals(company, usuarioCaptor.getValue().getEmpresa());
    }

    @Test
    void recoverAdminCreatesAdministratorForTheExistingCompany() {
        stubSetupLock();
        ReflectionTestUtils.setField(authService, "adminRecoveryKey", "0123456789abcdef0123456789abcdef");
        Empresa company = new Empresa();
        company.setId(7L);
        AdminRecoveryRequest request = new AdminRecoveryRequest(
            "0123456789abcdef0123456789abcdef",
            "new-admin",
            "new-admin@example.com",
            "ClaveSegura123"
        );

        when(empresaRepository.findByActiveTrue()).thenReturn(java.util.List.of(company));
        when(usuarioRepository.existsByUsername("new-admin")).thenReturn(false);
        when(usuarioRepository.existsByEmail("new-admin@example.com")).thenReturn(false);
        when(rolRepository.findByEmpresaIdAndNombreIgnoreCaseAndActiveTrue(7L, "ADMIN"))
            .thenReturn(java.util.Optional.empty());
        when(rolRepository.save(any(Rol.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.encode("ClaveSegura123")).thenReturn("encoded-password");
        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token");
        when(usuarioMapper.toResponse(any(Usuario.class))).thenReturn(
            new UsuarioResponse(2L, null, null, true, 7L, "new-admin", "new-admin@example.com", java.util.Set.of())
        );

        LoginResponse response = authService.recoverAdmin(request);

        assertEquals("jwt-token", response.token());
        ArgumentCaptor<Rol> roleCaptor = ArgumentCaptor.forClass(Rol.class);
        verify(rolRepository).save(roleCaptor.capture());
        assertEquals("ADMIN", roleCaptor.getValue().getNombre());
        assertEquals(company, roleCaptor.getValue().getEmpresa());
        ArgumentCaptor<Usuario> userCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).saveAndFlush(userCaptor.capture());
        assertEquals("new-admin", userCaptor.getValue().getUsername());
        assertEquals(company, userCaptor.getValue().getEmpresa());
    }

    @Test
    void recoverAdminRejectsAnInvalidRecoveryKey() {
        ReflectionTestUtils.setField(authService, "adminRecoveryKey", "0123456789abcdef0123456789abcdef");
        AdminRecoveryRequest request = new AdminRecoveryRequest(
            "abcdef0123456789abcdef0123456789",
            "new-admin",
            "new-admin@example.com",
            "ClaveSegura123"
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> authService.recoverAdmin(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        verify(empresaRepository, never()).findByActiveTrue();
    }
}
