package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.FormaPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface FormaPagoRepository extends JpaRepository<FormaPago, Long> {
	Page<FormaPago> findByActiveTrue(Pageable pageable);

	Page<FormaPago> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

	Optional<FormaPago> findByIdAndActiveTrue(Long id);

	boolean existsByEmpresaIdAndTipoAndActiveTrue(Long empresaId, com.rowin.contabilidad.entities.TipoFormaPago tipo);
}
