package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.inventario.InventarioSemanalResponse;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.InventarioSemanal;
import com.rowin.contabilidad.repositories.InventarioRepository;
import com.rowin.contabilidad.repositories.InventarioSemanalRepository;
import com.rowin.contabilidad.utils.HistorialSemanal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Guarda cada semana el stock de cada producto (US-04 / AC4). */
@Service
public class InventarioSemanalService {

    private static final Logger log = LoggerFactory.getLogger(InventarioSemanalService.class);

    private final InventarioRepository inventarioRepository;
    private final InventarioSemanalRepository inventarioSemanalRepository;

    public InventarioSemanalService(
        InventarioRepository inventarioRepository,
        InventarioSemanalRepository inventarioSemanalRepository
    ) {
        this.inventarioRepository = inventarioRepository;
        this.inventarioSemanalRepository = inventarioSemanalRepository;
    }

    /** Cada lunes a las 00:05 (hora de Colombia). */
    @Scheduled(cron = "0 5 0 * * MON", zone = "America/Bogota")
    @Transactional
    public void capturarSemanaProgramado() {
        int nuevos = capturarSemana(HistorialSemanal.inicioSemana(LocalDate.now()));
        log.info("Foto semanal de inventario: {} productos registrados", nuevos);
    }

    /**
     * Al arrancar la app también se registra la semana actual si faltan productos,
     * por si el servidor estaba apagado el lunes. No duplica: hay una fila por producto y semana.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void capturarAlArrancar() {
        try {
            int nuevos = capturarSemana(HistorialSemanal.inicioSemana(LocalDate.now()));
            log.info("Foto semanal de inventario al arrancar: {} productos registrados", nuevos);
        } catch (Exception e) {
            log.warn("No se pudo registrar la foto semanal de inventario al arrancar", e);
        }
    }

    public int capturarSemana(LocalDate semanaInicio) {
        Set<Long> yaRegistrados = new HashSet<>(inventarioSemanalRepository.findProductoIdsBySemanaInicio(semanaInicio));
        List<InventarioSemanal> nuevos = new ArrayList<>();

        for (Inventario inventario : inventarioRepository.findAll()) {
            if (!inventario.isActive() || yaRegistrados.contains(inventario.getProducto().getId())) {
                continue;
            }
            InventarioSemanal foto = new InventarioSemanal();
            foto.setEmpresa(inventario.getEmpresa());
            foto.setProducto(inventario.getProducto());
            foto.setSemanaInicio(semanaInicio);
            foto.setCantidad(inventario.getCantidadActual());
            nuevos.add(foto);
        }

        inventarioSemanalRepository.saveAll(nuevos);
        return nuevos.size();
    }

    @Transactional(readOnly = true)
    public List<InventarioSemanalResponse> historial(Long empresaId, int semanas) {
        if (semanas < 1 || semanas > 104) {
            throw new IllegalArgumentException("El número de semanas debe estar entre 1 y 104");
        }
        LocalDate desde = HistorialSemanal.inicioSemana(LocalDate.now()).minusWeeks(semanas - 1L);
        return inventarioSemanalRepository.findHistorial(empresaId, desde).stream()
            .map(s -> new InventarioSemanalResponse(
                s.getSemanaInicio(), s.getProducto().getId(), s.getProducto().getNombre(), s.getCantidad()))
            .toList();
    }
}