
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

    @EntityGraph(attributePaths = {"cliente", "formaPago", "cuentaPorCobrar"})
    Page<FacturaVenta> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"cliente", "formaPago", "cuentaPorCobrar"})
    Page<FacturaVenta> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    @EntityGraph(attributePaths = {"cliente", "formaPago", "cuentaPorCobrar"})
    Page<FacturaVenta> findByActiveTrueAndEmpresaIdAndClienteId(Pageable pageable, Long empresaId, Long clienteId);

    @EntityGraph(attributePaths = {"cliente", "formaPago", "cuentaPorCobrar", "detalles", "detalles.producto", "detalles.producto.inventario"})
    Optional<FacturaVenta> findByIdAndActiveTrue(Long id);

    @Query("SELECT DISTINCT f FROM FacturaVenta f " +
           "LEFT JOIN FETCH f.cliente " +
           "LEFT JOIN FETCH f.formaPago " +
           "LEFT JOIN FETCH f.cuentaPorCobrar " +
           "LEFT JOIN FETCH f.detalles d " +
           "LEFT JOIN FETCH d.producto p " +
           "LEFT JOIN FETCH p.inventario " +
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

    @Query("SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, " +
           "SUM(CASE WHEN f.subtotal > 0 THEN d.totalLinea - (f.descuento * d.totalLinea / f.subtotal) ELSE d.totalLinea END) AS total " +
           "FROM FacturaVenta f " +
           "JOIN f.detalles d " +
           "LEFT JOIN d.producto p " +
           "LEFT JOIN p.categoria c " +
           "WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.fechaEmision BETWEEN :inicio AND :fin " +
           "GROUP BY c.nombre " +
           "ORDER BY SUM(CASE WHEN f.subtotal > 0 THEN d.totalLinea - (f.descuento * d.totalLinea / f.subtotal) ELSE d.totalLinea END) DESC")
    List<Object[]> sumVentasPorCategoria(@Param("empresaId") Long empresaId,
                                          @Param("inicio") LocalDateTime inicio,
                                          @Param("fin") LocalDateTime fin);
     @Query("SELECT f.fechaEmision, f.estado, p.id, p.nombre, d.cantidad, d.totalLinea, f.subtotal, f.descuento " +
           "FROM FacturaVenta f " +
           "JOIN f.detalles d " +
           "JOIN d.producto p " +
           "WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.estado IN :estados " +
           "AND f.fechaEmision BETWEEN :inicio AND :fin")
    List<Object[]> findLineasVentaParaHistorial(@Param("empresaId") Long empresaId,
                                                @Param("estados") java.util.Collection<com.rowin.contabilidad.entities.FacturaEstado> estados,
                                                @Param("inicio") LocalDateTime inicio,
                                                @Param("fin") LocalDateTime fin);

      @Query("SELECT p.id, MIN(f.fechaEmision) " +
           "FROM FacturaVenta f " +
           "JOIN f.detalles d " +
           "JOIN d.producto p " +
           "WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.estado IN :estados " +
           "GROUP BY p.id")
    List<Object[]> findPrimeraVentaPorProducto(@Param("empresaId") Long empresaId,
                                               @Param("estados") java.util.Collection<com.rowin.contabilidad.entities.FacturaEstado> estados);

}