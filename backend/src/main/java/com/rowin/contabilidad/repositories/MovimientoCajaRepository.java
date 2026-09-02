package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.MovimientoCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    Page<MovimientoCaja> findByActiveTrue(Pageable pageable);

    Page<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId, Pageable pageable);

    Page<MovimientoCaja> findByEmpresaIdAndActiveTrue(Long empresaId, Pageable pageable);

    List<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId);
}
