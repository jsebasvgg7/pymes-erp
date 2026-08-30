package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.FacturaVenta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FacturaVentaRepository extends JpaRepository<FacturaVenta, Long> {

    Page<FacturaVenta> findByActiveTrue(Pageable pageable);

    Page<FacturaVenta> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    Page<FacturaVenta> findByActiveTrueAndEmpresaIdAndClienteId(Pageable pageable, Long empresaId, Long clienteId);

    Optional<FacturaVenta> findByIdAndActiveTrue(Long id);

    @Query("SELECT f FROM FacturaVenta f WHERE f.empresa.id = :empresaId AND f.active = true " +
           "AND f.fechaEmision BETWEEN :inicio AND :fin")
    List<FacturaVenta> findByEmpresaAndFechaBetween(@Param("empresaId") Long empresaId,
                                                     @Param("inicio") LocalDateTime inicio,
                                                     @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(MAX(f.numero), '0') FROM FacturaVenta f WHERE f.empresa.id = :empresaId")
    String findMaxNumeroByEmpresa(@Param("empresaId") Long empresaId);
}
