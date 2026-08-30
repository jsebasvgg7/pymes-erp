package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    Optional<Inventario> findByProductoIdAndActiveTrue(Long productoId);

    Optional<Inventario> findByProductoId(Long productoId);
}
