package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.PronosticoDemanda;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PronosticoDemandaRepository extends JpaRepository<PronosticoDemanda, Long> {

    @EntityGraph(attributePaths = "producto")
    List<PronosticoDemanda> findByEmpresaIdAndActiveTrue(Long empresaId);
}
