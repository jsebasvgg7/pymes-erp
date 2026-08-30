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

    Optional<Usuario> findByUsernameAndActiveTrue(String username);

    Optional<Usuario> findByEmailAndActiveTrue(String email);

    @Query("SELECT u FROM Usuario u WHERE u.empresa.id = :empresaId AND u.active = true " +
           "AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Usuario> searchByEmpresa(@Param("empresaId") Long empresaId,
                                  @Param("search") String search,
                                  Pageable pageable);

    boolean existsByUsernameAndActiveTrue(String username);

    boolean existsByEmailAndActiveTrue(String email);
}
