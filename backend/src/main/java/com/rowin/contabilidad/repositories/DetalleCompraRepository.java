package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.DetalleCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, Long> {

    List<DetalleCompra> findByCompraIdAndActiveTrue(Long compraId);
}
