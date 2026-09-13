package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.MovimientoInventario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    Page<MovimientoInventario> findByActiveTrue(Pageable pageable);

    Page<MovimientoInventario> findByProductoIdAndActiveTrue(Long productoId, Pageable pageable);

    Page<MovimientoInventario> findByEmpresaIdAndActiveTrue(Long empresaId, Pageable pageable);

    List<MovimientoInventario> findByProductoIdAndActiveTrue(Long productoId);
}
