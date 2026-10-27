package com.rowin.contabilidad.jobs;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.services.PronosticoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PronosticoJob {

    private static final Logger log = LoggerFactory.getLogger(PronosticoJob.class);

    private final EmpresaRepository empresaRepository;
    private final PronosticoService pronosticoService;

    public PronosticoJob(EmpresaRepository empresaRepository, PronosticoService pronosticoService) {
        this.empresaRepository = empresaRepository;
        this.pronosticoService = pronosticoService;
    }

    @Scheduled(cron = "0 0 1 * * ?")
    public void recalcularPronosticosNocturnos() {
        List<Empresa> empresas = empresaRepository.findByActiveTrue();
        for (Empresa empresa : empresas) {
            try {
                pronosticoService.recalcularPronosticos(empresa.getId());
            } catch (Exception e) {
                log.error("Error al recalcular pronósticos de la empresa {}", empresa.getId(), e);
            }
        }
    }
}
