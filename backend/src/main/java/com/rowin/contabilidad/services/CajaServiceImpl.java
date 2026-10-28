package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.CajaCreateRequest;
import com.rowin.contabilidad.dto.caja.CajaResponse;
import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.dto.caja.FlujoCajaDiarioResponse;
import com.rowin.contabilidad.dto.caja.MovimientoCajaRequest;
import com.rowin.contabilidad.dto.caja.MovimientoCajaResponse;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.MovimientoCaja;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.TipoReferenciaMovimientoCaja;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class CajaServiceImpl extends BaseCrudService implements CajaService {

    private final MovimientoCajaRepository movimientoCajaRepository;
    private final CajaRepository cajaRepository;
    private final EmpresaRepository empresaRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final AperturaCajaService aperturaCajaService;
    private final CajaMapper cajaMapper;
    private final EmpresaAccesoService empresaAccesoService;

    public CajaServiceImpl(
        MovimientoCajaRepository movimientoCajaRepository,
        CajaRepository cajaRepository,
        EmpresaRepository empresaRepository,
        FormaPagoRepository formaPagoRepository,
        AperturaCajaService aperturaCajaService,
        CajaMapper cajaMapper,
        EmpresaAccesoService empresaAccesoService
    ) {
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.cajaRepository = cajaRepository;
        this.empresaRepository = empresaRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.aperturaCajaService = aperturaCajaService;
        this.cajaMapper = cajaMapper;
        this.empresaAccesoService = empresaAccesoService;
    }

    @Override
    public CajaResponse crear(CajaCreateRequest request) {
        empresaAccesoService.exigir(request.empresaId());
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        CajaCreateRequest normalizado = request.saldoInicial() != null
            ? request
            : new CajaCreateRequest(request.empresaId(), request.nombre(), BigDecimal.ZERO);

        Caja entity = cajaMapper.toEntity(normalizado, empresa);
        Caja saved = cajaRepository.save(entity);
        return cajaMapper.toCajaResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CajaResponse> listarCajasPorEmpresa(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return cajaRepository.findByEmpresaIdAndActiveTrue(empresaId)
            .stream()
            .map(cajaMapper::toCajaResponse)
            .collect(Collectors.toList());
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
        empresaAccesoService.exigir(caja.getEmpresa().getId());
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
        empresaAccesoService.exigir(request.empresaId());
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        Caja caja = getByIdOrThrow(cajaRepository, request.cajaId(), "Caja");
        empresaAccesoService.exigir(caja.getEmpresa().getId());
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + request.cajaId());
        }

        AperturaCaja apertura = aperturaCajaService.exigirAperturaDeCaja(caja.getId());

        FormaPago formaPago = null;
        if (request.formaPagoId() != null) {
            formaPago = getByIdOrThrow(formaPagoRepository, request.formaPagoId(), "FormaPago");
            empresaAccesoService.exigir(formaPago.getEmpresa().getId());
            if (!isActive(formaPago)) {
                throw new ResourceNotFoundException("Forma de pago no encontrada: " + request.formaPagoId());
            }
        }

        MovimientoCaja movimiento = cajaMapper.toEntity(request, empresa, caja, formaPago);

        if (movimiento.getTipoReferencia() == null) {
            movimiento.setTipoReferencia(TipoReferenciaMovimientoCaja.AJUSTE);
        }

        movimiento.setApertura(apertura);
        movimiento.setFecha(LocalDateTime.now());
        MovimientoCaja saved = movimientoCajaRepository.save(movimiento);

        if (saved.getTipo() == TipoMovimientoCaja.INGRESO) {
            caja.setSaldoActual(caja.getSaldoActual().add(saved.getMonto()));
        } else if (saved.getTipo() == TipoMovimientoCaja.EGRESO) {
            caja.setSaldoActual(caja.getSaldoActual().subtract(saved.getMonto()));
        }

        cajaRepository.save(caja);

        return cajaMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CajaResumenResponse obtenerResumenCaja(Long cajaId) {
        Caja caja = getByIdOrThrow(cajaRepository, cajaId, "Caja");
        empresaAccesoService.exigir(caja.getEmpresa().getId());
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + cajaId);
        }
        return construirResumen(caja);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CajaResumenResponse> obtenerResumenTodasCajas(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        List<Caja> cajas = cajaRepository.findByEmpresaIdAndActiveTrue(empresaId);
        if (cajas.isEmpty()) {
            return List.of();
        }

        List<Long> cajaIds = cajas.stream().map(Caja::getId).toList();
        Map<Long, BigDecimal> ingresos = new HashMap<>();
        Map<Long, BigDecimal> egresos = new HashMap<>();
        Map<Long, Long> cantidades = new HashMap<>();

        for (Object[] fila : movimientoCajaRepository.resumenPorCajaYTipo(cajaIds)) {
            Long cajaId = (Long) fila[0];
            TipoMovimientoCaja tipo = (TipoMovimientoCaja) fila[1];
            BigDecimal suma = (BigDecimal) fila[2];
            cantidades.merge(cajaId, (Long) fila[3], Long::sum);
            if (tipo == TipoMovimientoCaja.INGRESO) {
                ingresos.put(cajaId, suma);
            } else {
                egresos.put(cajaId, suma);
            }
        }

        return cajas.stream()
            .map(caja -> new CajaResumenResponse(
                caja.getId(),
                caja.getNombre(),
                caja.getSaldoInicial(),
                caja.getSaldoActual(),
                ingresos.getOrDefault(caja.getId(), BigDecimal.ZERO),
                egresos.getOrDefault(caja.getId(), BigDecimal.ZERO),
                cantidades.getOrDefault(caja.getId(), 0L).intValue()
            ))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerSaldoActual(Long cajaId) {
        Caja caja = getByIdOrThrow(cajaRepository, cajaId, "Caja");
        empresaAccesoService.exigir(caja.getEmpresa().getId());
        if (!isActive(caja)) {
            throw new ResourceNotFoundException("Caja no encontrada: " + cajaId);
        }
        return caja.getSaldoActual();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlujoCajaDiarioResponse> obtenerFlujoCajaDiario(Long empresaId, Integer mesesAtras) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        LocalDateTime desde = mesesAtras != null
            ? LocalDateTime.now().minusMonths(mesesAtras).withDayOfMonth(1).toLocalDate().atStartOfDay()
            : null;

        List<Object[]> filas = desde != null
            ? movimientoCajaRepository.findFlujoCajaDesde(empresaId, desde)
            : movimientoCajaRepository.findFlujoCajaTodo(empresaId);

        java.util.Map<java.time.LocalDate, BigDecimal[]> porDia = new java.util.TreeMap<>();
        for (Object[] fila : filas) {
            java.time.LocalDate dia = ((LocalDateTime) fila[0]).toLocalDate();
            TipoMovimientoCaja tipo = (TipoMovimientoCaja) fila[1];
            BigDecimal monto = (BigDecimal) fila[2];

            BigDecimal[] par = porDia.computeIfAbsent(dia, d -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (tipo == TipoMovimientoCaja.INGRESO) {
                par[0] = par[0].add(monto);
            } else {
                par[1] = par[1].add(monto);
            }
        }

        return porDia.entrySet().stream()
            .map(e -> new FlujoCajaDiarioResponse(e.getKey(), e.getValue()[0], e.getValue()[1]))
            .toList();
    }

    private CajaResumenResponse construirResumen(Caja caja) {
        BigDecimal totalIngresos = movimientoCajaRepository.sumMontoByCajaAndTipo(caja.getId(), TipoMovimientoCaja.INGRESO);
        BigDecimal totalEgresos = movimientoCajaRepository.sumMontoByCajaAndTipo(caja.getId(), TipoMovimientoCaja.EGRESO);
        long total = movimientoCajaRepository.countByCajaIdAndActiveTrue(caja.getId());
        return new CajaResumenResponse(
            caja.getId(),
            caja.getNombre(),
            caja.getSaldoInicial(),
            caja.getSaldoActual(),
            totalIngresos,
            totalEgresos,
            (int) total
        );
    }
}
