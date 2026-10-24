package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfiguracionEmpresaSeederTest {

    @Mock private ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    @InjectMocks private ConfiguracionEmpresaSeeder seeder;

    private Empresa empresa() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);
        return empresa;
    }

    @Test
    void createsDefaultConfigurationWhenMissing() {
        Empresa empresa = empresa();
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.empty());
        when(configuracionEmpresaRepository.save(any(ConfiguracionEmpresa.class))).thenAnswer(i -> i.getArgument(0));

        ConfiguracionEmpresa creada = seeder.sembrar(empresa);

        ArgumentCaptor<ConfiguracionEmpresa> captor = ArgumentCaptor.forClass(ConfiguracionEmpresa.class);
        verify(configuracionEmpresaRepository).save(captor.capture());
        assertSame(empresa, captor.getValue().getEmpresa());
        assertEquals("COP", creada.getMoneda());
        assertNull(creada.getDiasVencimientoCredito());
    }

    @Test
    void doesNotDuplicateExistingConfiguration() {
        ConfiguracionEmpresa existente = new ConfiguracionEmpresa();
        when(configuracionEmpresaRepository.findByEmpresaId(1L)).thenReturn(Optional.of(existente));

        ConfiguracionEmpresa resultado = seeder.sembrar(empresa());

        assertSame(existente, resultado);
        verify(configuracionEmpresaRepository, never()).save(any());
    }
}
