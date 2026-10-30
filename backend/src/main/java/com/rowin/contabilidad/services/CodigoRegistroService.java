package com.rowin.contabilidad.services;

import com.rowin.contabilidad.exceptions.CodigoRegistroInvalidoException;
import com.rowin.contabilidad.repositories.CodigoRegistroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@Transactional
public class CodigoRegistroService {

    private final CodigoRegistroRepository codigoRegistroRepository;

    public CodigoRegistroService(CodigoRegistroRepository codigoRegistroRepository) {
        this.codigoRegistroRepository = codigoRegistroRepository;
    }

    public String consumir(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new CodigoRegistroInvalidoException();
        }
        String huella = calcularHuella(codigo.trim());
        if (codigoRegistroRepository.consumir(huella) != 1) {
            throw new CodigoRegistroInvalidoException();
        }
        return huella;
    }

    public void asignarEmpresa(String huella, Long empresaId) {
        codigoRegistroRepository.asignarEmpresa(huella, empresaId);
    }

    static String calcularHuella(String codigo) {
        try {
            byte[] resumen = MessageDigest.getInstance("SHA-256").digest(codigo.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumen);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no está disponible", e);
        }
    }
}
