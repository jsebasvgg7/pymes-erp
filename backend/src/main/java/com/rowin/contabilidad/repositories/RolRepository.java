package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {
	Page<Rol> findByActiveTrue(Pageable pageable);

	Page<Rol> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

	Optional<Rol> findByEmpresaIdAndNombreIgnoreCaseAndActiveTrue(Long empresaId, String nombre);
}
