package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracionEmpresaRepository extends JpaRepository<ConfiguracionEmpresa, Long> {

    Optional<ConfiguracionEmpresa> findByEmpresaId(Long empresaId);
}
