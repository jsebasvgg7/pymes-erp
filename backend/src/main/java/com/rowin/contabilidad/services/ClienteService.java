package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.cliente.ClienteCreateRequest;
import com.rowin.contabilidad.dto.cliente.ClienteResponse;
import com.rowin.contabilidad.dto.cliente.ClienteUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;

public interface ClienteService {

    Page<ClienteResponse> listar(Pageable pageable);

    Page<ClienteResponse> listarPorEmpresa(Long empresaId, Pageable pageable);

    long contarPorEmpresa(Long empresaId);

    ClienteResponse obtenerPorId(Long id);

    ClienteResponse crear(ClienteCreateRequest request);

    ClienteResponse actualizar(Long id, ClienteUpdateRequest request);

    void eliminar(Long id);

    void eliminarFisicamente(Long id);

    void abonarDeuda(Long clienteId, java.math.BigDecimal monto, Long formaPagoId);

    BigDecimal obtenerSaldoPendiente(Long id);

    java.util.Map<Long, BigDecimal> obtenerSaldosPendientesPorEmpresa(Long empresaId);
}
