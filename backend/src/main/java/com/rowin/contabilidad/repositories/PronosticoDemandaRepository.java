package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.PronosticoDemanda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PronosticoDemandaRepository extends JpaRepository<PronosticoDemanda, Long> {
    List<PronosticoDemanda> findByEmpresaIdAndActiveTrue(Long empresaId);

    Optional<PronosticoDemanda> findByEmpresaIdAndProductoIdAndActiveTrue(Long empresaId, Long productoId);
}