package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Empresa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    Page<Empresa> findByActiveTrue(Pageable pageable);

    // Método para obtener todas las empresas activas (sin paginación)
    List<Empresa> findByActiveTrue();

    Optional<Empresa> findByIdAndActiveTrue(Long id);
}
