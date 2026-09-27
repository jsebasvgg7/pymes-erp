package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @EntityGraph(attributePaths = "inventario")
    Page<Producto> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = "inventario")
    Page<Producto> findByActiveTrueAndEmpresaId(Pageable pageable, Long empresaId);

    @EntityGraph(attributePaths = "inventario")
    Page<Producto> findByActiveTrueAndEmpresaIdAndCategoriaId(Pageable pageable, Long empresaId, Long categoriaId);

    Optional<Producto> findByIdAndActiveTrue(Long id);

    @EntityGraph(attributePaths = "inventario")
    @Query("SELECT p FROM Producto p WHERE p.empresa.id = :empresaId AND p.active = true " +
           "AND LOWER(p.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Producto> searchByEmpresaAndNombre(@Param("empresaId") Long empresaId,
                                            @Param("search") String search,
                                            Pageable pageable);

    @Query("SELECT p FROM Producto p JOIN FETCH p.inventario i " +
           "WHERE p.empresa.id = :empresaId AND p.active = true " +
           "AND i.cantidadActual <= p.stockMinimo")
    List<Producto> findLowStockProducts(@Param("empresaId") Long empresaId);

    @Query("SELECT p FROM Producto p JOIN FETCH p.inventario i " +
           "WHERE p.empresa.id = :empresaId AND p.active = true " +
           "AND i.cantidadActual = 0")
    List<Producto> findOutOfStockProducts(@Param("empresaId") Long empresaId);

    @EntityGraph(attributePaths = "inventario")
    List<Producto> findByEmpresaIdAndActiveTrue(Long empresaId);

    boolean existsByEmpresaIdAndSkuAndActiveTrue(Long empresaId, String sku);
}