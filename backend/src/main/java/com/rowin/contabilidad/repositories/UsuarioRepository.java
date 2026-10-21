package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Page<Usuario> findByActiveTrue(Pageable pageable);

    Page<Usuario> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    Optional<Usuario> findByIdAndActiveTrue(Long id);

    // Agregamos LEFT JOIN FETCH u.roles para cargar los roles y evitar LazyInitializationException
    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles WHERE (u.username = :param OR u.email = :param) AND u.active = true")
    Optional<Usuario> findByUsernameAndActiveTrue(@Param("param") String param);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles WHERE u.username = :param OR u.email = :param")
    Optional<Usuario> findByUsername(@Param("param") String param);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles WHERE u.email = :email AND u.active = true")
    Optional<Usuario> findByEmailAndActiveTrue(@Param("email") String email);

    @Query("SELECT u FROM Usuario u WHERE u.empresa.id = :empresaId AND u.active = true " +
           "AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Usuario> searchByEmpresa(@Param("empresaId") Long empresaId,
                                  @Param("search") String search,
                                  Pageable pageable);

    boolean existsByUsernameAndActiveTrue(String username);

    boolean existsByUsername(String username);

    boolean existsByEmailAndActiveTrue(String email);

    boolean existsByEmail(String email);

    boolean existsByActiveTrue();
}
