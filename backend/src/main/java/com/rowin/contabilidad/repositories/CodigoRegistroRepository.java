package com.rowin.contabilidad.repositories;

import com.rowin.contabilidad.entities.CodigoRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CodigoRegistroRepository extends JpaRepository<CodigoRegistro, Long> {

    Optional<CodigoRegistro> findByCodigoHash(String codigoHash);

    @Modifying
    @Query(value = "UPDATE codigo_registro "
            + "SET usado_en = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
            + "WHERE codigo_hash = :hash AND usado_en IS NULL AND active = TRUE "
            + "AND expira_en > CURRENT_TIMESTAMP", nativeQuery = true)
    int consumir(@Param("hash") String hash);

    @Modifying
    @Query(value = "UPDATE codigo_registro "
            + "SET empresa_id = :empresaId, updated_at = CURRENT_TIMESTAMP "
            + "WHERE codigo_hash = :hash", nativeQuery = true)
    int asignarEmpresa(@Param("hash") String hash, @Param("empresaId") Long empresaId);
}
