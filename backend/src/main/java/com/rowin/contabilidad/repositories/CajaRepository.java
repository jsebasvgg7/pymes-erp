package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.Caja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CajaRepository extends JpaRepository<Caja, Long> {

    List<Caja> findByEmpresaIdAndActiveTrue(Long empresaId);
}
