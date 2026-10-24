package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Compra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    @EntityGraph(attributePaths = {"proveedor", "formaPago", "cuentaPorPagar"})
    Page<Compra> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"proveedor", "formaPago", "cuentaPorPagar"})
    Page<Compra> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    @EntityGraph(attributePaths = {"proveedor", "formaPago", "cuentaPorPagar"})
    Page<Compra> findByActiveTrueAndEmpresaIdAndProveedorId(Pageable pageable, Long empresaId, Long proveedorId);

    Optional<Compra> findByIdAndActiveTrue(Long id);

    @Query("SELECT DISTINCT c FROM Compra c " +
           "LEFT JOIN FETCH c.proveedor " +
           "LEFT JOIN FETCH c.formaPago " +
           "LEFT JOIN FETCH c.cuentaPorPagar " +
           "LEFT JOIN FETCH c.detalles d " +
           "LEFT JOIN FETCH d.producto p " +
           "LEFT JOIN FETCH p.inventario " +
           "WHERE c.empresa.id = :empresaId AND c.active = true " +
           "AND c.fechaCompra BETWEEN :inicio AND :fin")
    List<Compra> findByEmpresaAndFechaBetween(@Param("empresaId") Long empresaId,
                                               @Param("inicio") LocalDateTime inicio,
                                               @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(MAX(c.numeroDocumento), '0') FROM Compra c WHERE c.empresa.id = :empresaId")
    String findMaxNumeroDocumentoByEmpresa(@Param("empresaId") Long empresaId);
}
