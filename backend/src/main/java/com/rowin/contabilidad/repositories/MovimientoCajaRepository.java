package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.MovimientoCaja;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    Page<MovimientoCaja> findByActiveTrue(Pageable pageable);

    Page<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId, Pageable pageable);

    Page<MovimientoCaja> findByEmpresaIdAndActiveTrue(Long empresaId, Pageable pageable);

    List<MovimientoCaja> findByCajaIdAndActiveTrue(Long cajaId);

    long countByCajaIdAndActiveTrue(Long cajaId);

    @Query("SELECT COALESCE(SUM(m.monto), 0) FROM MovimientoCaja m " +
           "WHERE m.caja.id = :cajaId AND m.active = true AND m.tipo = :tipo")
    BigDecimal sumMontoByCajaAndTipo(@Param("cajaId") Long cajaId,
                                      @Param("tipo") TipoMovimientoCaja tipo);

    @Query("SELECT m.fecha AS fecha, m.tipo AS tipo, m.monto AS monto " +
           "FROM MovimientoCaja m " +
           "WHERE m.empresa.id = :empresaId AND m.active = true " +
           "AND m.fecha >= :desde " +
           "ORDER BY m.fecha ASC")
    List<Object[]> findFlujoCajaDesde(@Param("empresaId") Long empresaId,
                                       @Param("desde") LocalDateTime desde);

    @Query("SELECT m.fecha AS fecha, m.tipo AS tipo, m.monto AS monto " +
           "FROM MovimientoCaja m " +
           "WHERE m.empresa.id = :empresaId AND m.active = true " +
           "ORDER BY m.fecha ASC")
    List<Object[]> findFlujoCajaTodo(@Param("empresaId") Long empresaId);
}
