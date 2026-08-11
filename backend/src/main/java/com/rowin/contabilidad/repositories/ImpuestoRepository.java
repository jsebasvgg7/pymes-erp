package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Impuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ImpuestoRepository extends JpaRepository<Impuesto, Long> {
	Page<Impuesto> findByActiveTrue(Pageable pageable);
}
