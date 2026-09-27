package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.FacturaVenta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FacturaVentaRepository extends JpaRepository<FacturaVenta, Long> {

    @EntityGraph(attributePaths = {"cliente", "formaPago"})
    Page<FacturaVenta> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"cliente", "formaPago"})
    Page<FacturaVenta> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    @EntityGraph(attributePaths = {"cliente", "formaPago"})
    Page<FacturaVenta> findByActiveTrueAndEmpresaIdAndClienteId(Pageable pageable, Long empresaId, Long clienteId);

    @EntityGraph(attributePaths = {"cliente", "formaPago", "detalles", "detalles.producto"})
    Optional<FacturaVenta> findByIdAndActiveTrue(Long id);

    @Query("SELECT DISTINCT f FROM FacturaVenta f " +
           "LEFT JOIN FETCH f.cliente " +
           "LEFT JOIN FETCH f.formaPago " +
           "LEFT JOIN FETCH f.detalles d " +
           "LEFT JOIN FETCH d.producto " +
           "WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.fechaEmision BETWEEN :inicio AND :fin")
    List<FacturaVenta> findByEmpresaAndFechaBetween(@Param("empresaId") Long empresaId,
                                                     @Param("inicio") LocalDateTime inicio,
                                                     @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(f.total), 0) FROM FacturaVenta f " +
           "WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.fechaEmision BETWEEN :inicio AND :fin")
    BigDecimal sumTotalByEmpresaAndFechaBetween(@Param("empresaId") Long empresaId,
                                                 @Param("inicio") LocalDateTime inicio,
                                                 @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(MAX(f.numero), '0') FROM FacturaVenta f WHERE f.empresa.id = :empresaId")
    String findMaxNumeroByEmpresa(@Param("empresaId") Long empresaId);
}