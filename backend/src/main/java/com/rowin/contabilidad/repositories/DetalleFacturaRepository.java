package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, Long> {

    List<DetalleFactura> findByFacturaVentaIdAndActiveTrue(Long facturaVentaId);
}
