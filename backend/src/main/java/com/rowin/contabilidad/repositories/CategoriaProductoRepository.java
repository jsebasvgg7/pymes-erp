package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.CategoriaProducto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaProductoRepository extends JpaRepository<CategoriaProducto, Long> {
	Page<CategoriaProducto> findByActiveTrue(Pageable pageable);
}

