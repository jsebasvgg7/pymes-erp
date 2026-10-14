package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.CuentaPorCobrar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface CuentaPorCobrarRepository extends JpaRepository<CuentaPorCobrar, Long> {

    Optional<CuentaPorCobrar> findByFacturaVentaIdAndActiveTrue(Long facturaVentaId);

    @Query("SELECT COALESCE(SUM(c.saldo), 0) FROM CuentaPorCobrar c WHERE c.cliente.id = :clienteId AND c.active = true AND c.saldo > 0")
    BigDecimal calcularSaldoPendientePorCliente(@Param("clienteId") Long clienteId);
}
