package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.MovimientoCaja;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {
}
