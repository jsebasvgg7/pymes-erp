package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.FormaPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FormaPagoRepository extends JpaRepository<FormaPago, Long> {
	Page<FormaPago> findByActiveTrue(Pageable pageable);
}
