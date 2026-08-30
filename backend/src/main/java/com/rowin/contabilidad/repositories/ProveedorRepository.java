package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Proveedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    Page<Proveedor> findByActiveTrue(Pageable pageable);

    Page<Proveedor> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    Optional<Proveedor> findByIdAndActiveTrue(Long id);

    @Query("SELECT p FROM Proveedor p WHERE p.empresa.id = :empresaId AND p.active = true AND LOWER(p.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Proveedor> searchByEmpresaAndNombre(@Param("empresaId") Long empresaId, @Param("search") String search, Pageable pageable);

    List<Proveedor> findByEmpresaIdAndActiveTrue(Long empresaId);
}
