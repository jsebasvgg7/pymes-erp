package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByActiveTrue(Pageable pageable);

    Page<Cliente> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    Optional<Cliente> findByIdAndActiveTrue(Long id);

    @Query("SELECT c FROM Cliente c WHERE c.empresa.id = :empresaId AND c.active = true AND LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Cliente> searchByEmpresaAndNombre(@Param("empresaId") Long empresaId, @Param("search") String search, Pageable pageable);

    List<Cliente> findByEmpresaIdAndActiveTrue(Long empresaId);
}
