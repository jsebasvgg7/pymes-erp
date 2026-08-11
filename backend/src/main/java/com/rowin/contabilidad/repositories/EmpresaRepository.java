package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
	Page<Empresa> findByActiveTrue(Pageable pageable);
}
