package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Compra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    Page<Compra> findByActiveTrue(Pageable pageable);

    Page<Compra> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    Page<Compra> findByActiveTrueAndEmpresaIdAndProveedorId(Pageable pageable, Long empresaId, Long proveedorId);

    Optional<Compra> findByIdAndActiveTrue(Long id);

    @Query("SELECT c FROM Compra c WHERE c.empresa.id = :empresaId AND c.active = true " +
           "AND c.fechaCompra BETWEEN :inicio AND :fin")
    List<Compra> findByEmpresaAndFechaBetween(@Param("empresaId") Long empresaId,
                                               @Param("inicio") LocalDateTime inicio,
                                               @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(MAX(c.numeroDocumento), '0') FROM Compra c WHERE c.empresa.id = :empresaId")
    String findMaxNumeroDocumentoByEmpresa(@Param("empresaId") Long empresaId);
}
