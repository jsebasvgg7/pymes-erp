package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.MovimientoCaja;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.utils.mappers.CajaMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CajaServiceImpl extends BaseCrudService implements CajaService {

    private final MovimientoCajaRepository movimientoCajaRepository;
    private final CajaRepository cajaRepository;
    private final EmpresaRepository empresaRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final CajaMapper cajaMapper;

    public CajaServiceImpl(
        MovimientoCajaRepository movimientoCajaRepository,
        CajaRepository cajaRepository,
        EmpresaRepository empresaRepository,
        FormaPagoRepository formaPagoRepository,
        CajaMapper cajaMapper
    ) {
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.cajaRepository = cajaRepository;
        this.empresaRepository = empresaRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.cajaMapper = cajaMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovimientoCajaResponse> listarMovimientos(Pageable pageable) {
        return movimientoCajaRepository.findByActiveTrue(pageable)
            .map(cajaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovimientoCajaResponse> listarMovimientosPorCaja(Long cajaId, Pageable pageable) {
        Caja caja = getByIdOrThrow(cajaRepository, cajaId, "Caja");
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + cajaId);
        }

        return movimientoCajaRepository.findByCajaIdAndActiveTrue(cajaId, pageable)
            .map(cajaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovimientoCajaResponse> listarMovimientosPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return movimientoCajaRepository.findByEmpresaIdAndActiveTrue(empresaId, pageable)
            .map(cajaMapper::toResponse);
    }

    @Override
    public MovimientoCajaResponse registrarMovimiento(MovimientoCajaRequest request) {
        // Validar empresa
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        // Validar caja
        Caja caja = getByIdOrThrow(cajaRepository, request.cajaId(), "Caja");
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + request.cajaId());
        }

        // Validar forma de pago (opcional)
        FormaPago formaPago = null;
        if (request.formaPagoId() != null) {
            formaPago = getByIdOrThrow(formaPagoRepository, request.formaPagoId(), "FormaPago");
            if (!isActive(formaPago)) {
                throw new ResourceNotFoundException("Forma de pago no encontrada: " + request.formaPagoId());
            }
        }

        // Crear movimiento
        MovimientoCaja movimiento = cajaMapper.toEntity(request, empresa, caja, formaPago);
        movimiento.setFecha(LocalDateTime.now());

        // Actualizar saldo de caja
        BigDecimal nuevoSaldo = caja.getSaldoActual();
        if (request.tipo() == com.rowin.contabilidad.entities.TipoMovimientoCaja.INGRESO) {
            nuevoSaldo = nuevoSaldo.add(request.monto());
        } else {
            nuevoSaldo = nuevoSaldo.subtract(request.monto());
        }
        caja.setSaldoActual(nuevoSaldo);
        cajaRepository.save(caja);

        MovimientoCaja saved = movimientoCajaRepository.save(movimiento);
        return cajaMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CajaResumenResponse obtenerResumenCaja(Long cajaId) {
        Caja caja = getByIdOrThrow(cajaRepository, cajaId, "Caja");
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + cajaId);
        }

        List<MovimientoCaja> movimientos = movimientoCajaRepository.findByCajaIdAndActiveTrue(cajaId);

        BigDecimal totalIngresos = movimientos.stream()
            .filter(m -> m.getTipo() == com.rowin.contabilidad.entities.TipoMovimientoCaja.INGRESO)
            .map(MovimientoCaja::getMonto)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEgresos = movimientos.stream()
            .filter(m -> m.getTipo() == com.rowin.contabilidad.entities.TipoMovimientoCaja.EGRESO)
            .map(MovimientoCaja::getMonto)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CajaResumenResponse(
            caja.getId(),
            caja.getNombre(),
            caja.getSaldoInicial(),
            caja.getSaldoActual(),
            totalIngresos,
            totalEgresos,
            movimientos.size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CajaResumenResponse> obtenerResumenTodasCajas(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        List<Caja> cajas = cajaRepository.findByEmpresaIdAndActiveTrue(empresaId);

        return cajas.stream()
            .map(caja -> {
                List<MovimientoCaja> movimientos = movimientoCajaRepository.findByCajaIdAndActiveTrue(caja.getId());

                BigDecimal totalIngresos = movimientos.stream()
                    .filter(m -> m.getTipo() == com.rowin.contabilidad.entities.TipoMovimientoCaja.INGRESO)
                    .map(MovimientoCaja::getMonto)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalEgresos = movimientos.stream()
                    .filter(m -> m.getTipo() == com.rowin.contabilidad.entities.TipoMovimientoCaja.EGRESO)
                    .map(MovimientoCaja::getMonto)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                return new CajaResumenResponse(
                    caja.getId(),
                    caja.getNombre(),
                    caja.getSaldoInicial(),
                    caja.getSaldoActual(),
                    totalIngresos,
                    totalEgresos,
                    movimientos.size()
                );
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerSaldoActual(Long cajaId) {
        Caja caja = getByIdOrThrow(cajaRepository, cajaId, "Caja");
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + cajaId);
        }
        return caja.getSaldoActual();
    }
}
