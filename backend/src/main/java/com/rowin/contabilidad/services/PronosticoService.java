package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.pronostico.PronosticoDemandaResponse;

import java.util.List;

public interface PronosticoService {

    void recalcularPronosticos(Long empresaId);

    void recalcularPronosticos(Long empresaId, String email);

    List<PronosticoDemandaResponse> obtenerPronosticosPorEmpresa(Long empresaId, String email);
}
