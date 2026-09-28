package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.MovimientoCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    Page<MovimientoCaja> findByActiveTrue(Pageable pageable);

    Page<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId, Pageable pageable);

    Page<MovimientoCaja> findByEmpresaIdAndActiveTrue(Long empresaId, Pageable pageable);

    List<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId);

    @Query("SELECT CAST(m.fecha AS date) AS dia, m.tipo AS tipo, SUM(m.monto) AS total " +
           "FROM MovimientoCaja m " +
           "WHERE m.empresa.id = :empresaId AND m.active = true " +
           "AND (:desde IS NULL OR m.fecha >= :desde) " +
           "GROUP BY CAST(m.fecha AS date), m.tipo " +
           "ORDER BY CAST(m.fecha AS date) ASC")
    List<Object[]> sumFlujoCajaPorDia(@Param("empresaId") Long empresaId,
                                       @Param("desde") LocalDateTime desde);
}