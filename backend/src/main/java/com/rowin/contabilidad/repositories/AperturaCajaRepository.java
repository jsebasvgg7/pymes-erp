package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.EstadoAperturaCaja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AperturaCajaRepository extends JpaRepository<AperturaCaja, Long> {

    @EntityGraph(attributePaths = {"caja"})
    Optional<AperturaCaja> findFirstByCajaIdAndEstado(Long cajaId, EstadoAperturaCaja estado);

    @EntityGraph(attributePaths = {"caja"})
    @Query("SELECT a FROM AperturaCaja a WHERE a.empresa.id = :empresaId AND a.estado = :estado " +
           "AND a.active = true AND a.caja.active = true ORDER BY a.caja.id ASC")
    List<AperturaCaja> findPorEmpresaYEstado(@Param("empresaId") Long empresaId,
                                             @Param("estado") EstadoAperturaCaja estado);

    @EntityGraph(attributePaths = {"caja", "usuarioApertura", "usuarioCierre"})
    Page<AperturaCaja> findByCajaIdAndEstadoOrderByFechaCierreDesc(Long cajaId, EstadoAperturaCaja estado, Pageable pageable);

    @EntityGraph(attributePaths = {"caja", "usuarioApertura", "usuarioCierre"})
    Optional<AperturaCaja> findFirstByCajaIdAndEstadoOrderByFechaCierreDesc(Long cajaId, EstadoAperturaCaja estado);

    @EntityGraph(attributePaths = {"caja", "usuarioApertura", "usuarioCierre"})
    Optional<AperturaCaja> findFirstByCajaIdOrderByIdDesc(Long cajaId);

    @EntityGraph(attributePaths = {"caja", "usuarioApertura"})
    List<AperturaCaja> findByEstado(EstadoAperturaCaja estado);
}
