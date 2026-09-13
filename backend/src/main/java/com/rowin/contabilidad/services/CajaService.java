package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.CajaResponse;
import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface CajaService {

    CajaResponse crear(CajaCreateRequest request);

    List<CajaResponse> listarCajasPorEmpresa(Long empresaId);

    Page<MovimientoCajaResponse> listarMovimientos(Pageable pageable);

    Page<MovimientoCajaResponse> listarMovimientosPorCaja(Long cajaId, Pageable pageable);

    Page<MovimientoCajaResponse> listarMovimientosPorEmpresa(Long empresaId, Pageable pageable);

    MovimientoCajaResponse registrarMovimiento(MovimientoCajaRequest request);

    CajaResumenResponse obtenerResumenCaja(Long cajaId);

    List<CajaResumenResponse> obtenerResumenTodasCajas(Long empresaId);

    BigDecimal obtenerSaldoActual(Long cajaId);
}