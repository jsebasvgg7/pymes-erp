package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.cliente.ClienteCreateRequest;
import com.rowin.contabilidad.dto.cliente.ClienteResponse;
import com.rowin.contabilidad.dto.cliente.ClienteUpdateRequest;
import com.rowin.contabilidad.entities.Cliente;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.ClienteRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.ClienteMapper;
import com.rowin.contabilidad.repositories.CuentaPorCobrarRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.repositories.FacturaVentaRepository;
import com.rowin.contabilidad.entities.*;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ClienteServiceImpl extends BaseCrudService implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final EmpresaRepository empresaRepository;
    private final ClienteMapper clienteMapper;
    private final CuentaPorCobrarRepository cuentaPorCobrarRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final CajaRepository cajaRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final FacturaVentaRepository facturaVentaRepository;

    public ClienteServiceImpl(
        ClienteRepository clienteRepository,
        EmpresaRepository empresaRepository,
        ClienteMapper clienteMapper,
        CuentaPorCobrarRepository cuentaPorCobrarRepository,
        FormaPagoRepository formaPagoRepository,
        CajaRepository cajaRepository,
        MovimientoCajaRepository movimientoCajaRepository,
        FacturaVentaRepository facturaVentaRepository
    ) {
        this.clienteRepository = clienteRepository;
        this.empresaRepository = empresaRepository;
        this.clienteMapper = clienteMapper;
        this.cuentaPorCobrarRepository = cuentaPorCobrarRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.cajaRepository = cajaRepository;
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.facturaVentaRepository = facturaVentaRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(Pageable pageable) {
        return clienteRepository.findByActiveTrue(pageable)
            .map(clienteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        // Verificar que la empresa existe
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return clienteRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(clienteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        return clienteMapper.toResponse(entity);
    }

    @Override
    public ClienteResponse crear(ClienteCreateRequest request) {
        // Verificar que la empresa existe
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        Cliente entity = clienteMapper.toEntity(request, empresa);
        Cliente saved = clienteRepository.save(entity);
        return clienteMapper.toResponse(saved);
    }

    @Override
    public ClienteResponse actualizar(Long id, ClienteUpdateRequest request) {
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));

        clienteMapper.updateEntity(request, entity);
        Cliente saved = clienteRepository.save(entity);
        return clienteMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        // Soft delete
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        softDelete(entity);
        clienteRepository.save(entity);
    }

    @Override
    public void eliminarFisicamente(Long id) {
        // Hard delete (físico)
        Cliente entity = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        clienteRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerSaldoPendiente(Long id) {
        // Validamos que el cliente exista
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));

        return cuentaPorCobrarRepository.calcularSaldoPendientePorCliente(id);
    }

    @Override
        @Transactional
        public void abonarDeuda(Long clienteId, BigDecimal monto, Long formaPagoId) {
            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("El monto a abonar debe ser mayor a 0");
            }

            Cliente cliente = clienteRepository.findByIdAndActiveTrue(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

            FormaPago formaPago = formaPagoRepository.findByIdAndActiveTrue(formaPagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Forma de pago no encontrada"));

            Caja caja = cajaRepository.findByEmpresaIdAndActiveTrue(cliente.getEmpresa().getId())
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No hay una caja activa para procesar el abono"));

            List<CuentaPorCobrar> pendientes = cuentaPorCobrarRepository.findPendientesByClienteId(clienteId);
            BigDecimal restante = monto;

            // Repartir el dinero entre las deudas pendientes
            for (CuentaPorCobrar cuenta : pendientes) {
                if (restante.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal abono = restante.min(cuenta.getSaldo());
                cuenta.setSaldo(cuenta.getSaldo().subtract(abono));
                restante = restante.subtract(abono);

                if (cuenta.getSaldo().compareTo(BigDecimal.ZERO) == 0) {
                    cuenta.setEstado(EstadoCuenta.PAGADA);
                    if (cuenta.getFacturaVenta() != null) {
                        FacturaVenta factura = cuenta.getFacturaVenta();
                        factura.setEstado(FacturaEstado.PAGADA);
                        facturaVentaRepository.save(factura);
                    }
                } else {
                    cuenta.setEstado(EstadoCuenta.PARCIAL);
                }
                cuentaPorCobrarRepository.save(cuenta);
            }

            // Registrar el ingreso en la caja
            MovimientoCaja movimiento = new MovimientoCaja();
            movimiento.setEmpresa(cliente.getEmpresa());
            movimiento.setCaja(caja);
            movimiento.setFormaPago(formaPago);
            movimiento.setFecha(LocalDateTime.now());
            movimiento.setTipo(TipoMovimientoCaja.INGRESO);
            movimiento.setMonto(monto);
            movimiento.setDescripcion("Abono de deuda - Cliente: " + cliente.getNombre());
            movimientoCajaRepository.save(movimiento);

            caja.setSaldoActual(caja.getSaldoActual().add(monto));
            cajaRepository.save(caja);
        }

}
