package com.rowin.contabilidad.jobs;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.services.PronosticoService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PronosticoJob {

    private final EmpresaRepository empresaRepository;
    private final PronosticoService pronosticoService;

    public PronosticoJob(EmpresaRepository empresaRepository, PronosticoService pronosticoService) {
        this.empresaRepository = empresaRepository;
        this.pronosticoService = pronosticoService;
    }

    // Se ejecuta automáticamente todos los días a la 1:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    public void recalcularPronosticosNocturnos() {
        // Asumiendo que existe un método findByActiveTrue() en EmpresaRepository
        List<Empresa> empresas = empresaRepository.findByActiveTrue();
        for (Empresa empresa : empresas) {
            try {
                pronosticoService.recalcularPronosticos(empresa.getId());
            } catch (Exception e) {
                System.err.println(
                        "Error al recalcular pronóstico para la empresa " + empresa.getId() + ": " + e.getMessage());
            }
        }
    }
}