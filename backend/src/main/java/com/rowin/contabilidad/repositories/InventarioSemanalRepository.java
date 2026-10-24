package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.InventarioSemanal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InventarioSemanalRepository extends JpaRepository<InventarioSemanal, Long> {

    @Query("SELECT s.producto.id FROM InventarioSemanal s WHERE s.semanaInicio = :semana")
    List<Long> findProductoIdsBySemanaInicio(@Param("semana") LocalDate semana);

    @Query("SELECT s FROM InventarioSemanal s JOIN FETCH s.producto p " +
           "WHERE s.empresa.id = :empresaId AND s.active = true AND s.semanaInicio >= :desde " +
           "ORDER BY s.semanaInicio, p.nombre")
    List<InventarioSemanal> findHistorial(@Param("empresaId") Long empresaId, @Param("desde") LocalDate desde);
}