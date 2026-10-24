package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import org.springframework.stereotype.Component;

@Component
public class ConfiguracionEmpresaSeeder {

    private final ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    public ConfiguracionEmpresaSeeder(ConfiguracionEmpresaRepository configuracionEmpresaRepository) {
        this.configuracionEmpresaRepository = configuracionEmpresaRepository;
    }

    public ConfiguracionEmpresa sembrar(Empresa empresa) {
        return configuracionEmpresaRepository.findByEmpresaId(empresa.getId()).orElseGet(() -> {
            ConfiguracionEmpresa configuracion = new ConfiguracionEmpresa();
            configuracion.setEmpresa(empresa);
            return configuracionEmpresaRepository.save(configuracion);
        });
    }
}
