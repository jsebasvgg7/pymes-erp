package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.PronosticoDemanda;
import java.util.List;

public interface PronosticoService {
    void recalcularPronosticos(Long empresaId);

    List<PronosticoDemanda> obtenerPronosticosPorEmpresa(Long empresaId);
}