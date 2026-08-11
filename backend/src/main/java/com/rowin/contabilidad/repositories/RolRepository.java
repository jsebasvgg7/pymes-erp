package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RolRepository extends JpaRepository<Rol, Long> {
	Page<Rol> findByActiveTrue(Pageable pageable);
}
