package com.rowin.contabilidad.services;

import java.math.BigDecimal;
import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaCreateRequest;
import com.rowin.contabilidad.dto.factura.FacturaVentaResponse;
import com.rowin.contabilidad.dto.factura.FacturaVentaUpdateRequest;
import com.rowin.contabilidad.entities.*;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.*;
import com.rowin.contabilidad.utils.mappers.FacturaVentaMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class FacturaVentaServiceImpl extends BaseCrudService implements FacturaVentaService {

    private final FacturaVentaRepository facturaVentaRepository;
    private final DetalleFacturaRepository detalleFacturaRepository;
    private final EmpresaRepository empresaRepository;
    private final ClienteRepository clienteRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final ImpuestoRepository impuestoRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final CajaRepository cajaRepository;
    private final FacturaVentaMapper facturaVentaMapper;

    public FacturaVentaServiceImpl(
        FacturaVentaRepository facturaVentaRepository,
        DetalleFacturaRepository detalleFacturaRepository,
        EmpresaRepository empresaRepository,
        ClienteRepository clienteRepository,
        FormaPagoRepository formaPagoRepository,
        ProductoRepository productoRepository,
        InventarioRepository inventarioRepository,
        ImpuestoRepository impuestoRepository,
        MovimientoCajaRepository movimientoCajaRepository,
        CajaRepository cajaRepository,
        FacturaVentaMapper facturaVentaMapper
    ) {
        this.facturaVentaRepository = facturaVentaRepository;
        this.detalleFacturaRepository = detalleFacturaRepository;
        this.empresaRepository = empresaRepository;
        this.clienteRepository = clienteRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.impuestoRepository = impuestoRepository;
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.cajaRepository = cajaRepository;
        this.facturaVentaMapper = facturaVentaMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacturaVentaResponse> listar(Pageable pageable) {
        return facturaVentaRepository.findByActiveTrue(pageable)
            .map(facturaVentaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacturaVentaResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return facturaVentaRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(facturaVentaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacturaVentaResponse> listarPorEmpresaYCliente(Long empresaId, Long clienteId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        Cliente cliente = getByIdOrThrow(clienteRepository, clienteId, "Cliente");
        if (!isActive(cliente)) {
            throw new ResourceNotFoundException("Cliente no encontrado: " + clienteId);
        }

        return facturaVentaRepository.findByActiveTrueAndEmpresaIdAndClienteId(pageable, empresaId, clienteId)
            .map(facturaVentaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaVentaResponse obtenerPorId(Long id) {
        FacturaVenta entity = facturaVentaRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));
        return facturaVentaMapper.toResponse(entity);
    }

    @Override
    public FacturaVentaResponse crear(FacturaVentaCreateRequest request) {
        // 1. Validar empresa
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        // 2. Validar cliente (opcional)
        Cliente cliente = null;
        if (request.clienteId() != null) {
            cliente = getByIdOrThrow(clienteRepository, request.clienteId(), "Cliente");
            if (!isActive(cliente)) {
                throw new ResourceNotFoundException("Cliente no encontrado: " + request.clienteId());
            }
        }

        // 3. Validar forma de pago
        FormaPago formaPago = getByIdOrThrow(formaPagoRepository, request.formaPagoId(), "FormaPago");
        if (!isActive(formaPago)) {
            throw new ResourceNotFoundException("Forma de pago no encontrada: " + request.formaPagoId());
        }

        // 4. Validar que haya detalles
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new IllegalArgumentException("La factura debe tener al menos un detalle");
        }

        // 5. Obtener caja activa para la empresa (por ahora tomamos la primera)
        Caja caja = cajaRepository.findByEmpresaIdAndActiveTrue(empresa.getId())
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("No hay una caja activa para esta empresa"));

        // 6. Crear la factura
        FacturaVenta factura = facturaVentaMapper.toEntity(request);
        factura.setEmpresa(empresa);
        factura.setCliente(cliente);
        factura.setFormaPago(formaPago);
        factura.setFechaEmision(LocalDateTime.now());
        factura.setEstado(FacturaEstado.EMITIDA);

        // Generar número de factura (formato: FAC-YYYYMMDD-XXXXX)
        String maxNumero = facturaVentaRepository.findMaxNumeroByEmpresa(empresa.getId());
        int secuencia = 1;
        if (maxNumero != null && !maxNumero.equals("0")) {
            try {
                String[] parts = maxNumero.split("-");
                if (parts.length == 3) {
                    secuencia = Integer.parseInt(parts[2]) + 1;
                }
            } catch (NumberFormatException e) {
                // Si falla, usar 1
            }
        }
        String numero = String.format("FAC-%tY%<tm%<td-%05d", LocalDateTime.now(), secuencia);
        factura.setNumero(numero);

        // 7. Procesar detalles y calcular totales
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalImpuestos = BigDecimal.ZERO;
        List<DetalleFactura> detalles = new ArrayList<>();

        for (DetalleFacturaRequest detalleReq : request.detalles()) {
            DetalleFactura detalle = new DetalleFactura();
            detalle.setFacturaVenta(factura);
            detalle.setDescripcion(detalleReq.descripcion());
            detalle.setCantidad(detalleReq.cantidad());
            detalle.setPrecioUnitario(detalleReq.precioUnitario());

            // Si tiene producto, validar stock y actualizar inventario
            if (detalleReq.productoId() != null) {
                Producto producto = getByIdOrThrow(productoRepository, detalleReq.productoId(), "Producto");
                if (!isActive(producto)) {
                    throw new ResourceNotFoundException("Producto no encontrado: " + detalleReq.productoId());
                }

                // Validar stock
                Inventario inventario = inventarioRepository.findByProductoIdAndActiveTrue(producto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado para el producto: " + producto.getId()));

                if (inventario.getCantidadActual().compareTo(detalleReq.cantidad()) < 0) {
                    throw new IllegalArgumentException("Stock insuficiente para el producto: " + producto.getNombre() +
                        ". Disponible: " + inventario.getCantidadActual() + ", Solicitado: " + detalleReq.cantidad());
                }

                detalle.setProducto(producto);

                // Actualizar inventario (restar stock)
                inventario.setCantidadActual(inventario.getCantidadActual().subtract(detalleReq.cantidad()));
                inventarioRepository.save(inventario);

                // Si tiene impuestos, asignarlos
                if (detalleReq.impuestoIds() != null && !detalleReq.impuestoIds().isEmpty()) {
                    Set<Impuesto> impuestos = new HashSet<>();
                    for (Long impuestoId : detalleReq.impuestoIds()) {
                        Impuesto impuesto = getByIdOrThrow(impuestoRepository, impuestoId, "Impuesto");
                        if (!isActive(impuesto)) {
                            throw new ResourceNotFoundException("Impuesto no encontrado: " + impuestoId);
                        }
                        impuestos.add(impuesto);
                        // Calcular impuesto
                        BigDecimal impuestoMonto = detalleReq.cantidad()
                            .multiply(detalleReq.precioUnitario())
                            .multiply(impuesto.getPorcentaje().divide(new BigDecimal(100)));
                        totalImpuestos = totalImpuestos.add(impuestoMonto);
                    }
                    detalle.setImpuestos(impuestos);
                }
            }

            // Calcular total del detalle
            BigDecimal totalLinea = detalleReq.cantidad().multiply(detalleReq.precioUnitario());
            detalle.setTotalLinea(totalLinea);
            subtotal = subtotal.add(totalLinea);

            detalles.add(detalle);
        }

        // 8. Actualizar totales de la factura
        factura.setSubtotal(subtotal);
        factura.setTotalImpuestos(totalImpuestos);
        factura.setTotal(subtotal.add(totalImpuestos));

        // 9. Guardar factura
        FacturaVenta savedFactura = facturaVentaRepository.save(factura);

        // 10. Guardar detalles
        for (DetalleFactura detalle : detalles) {
            detalle.setFacturaVenta(savedFactura);
            detalleFacturaRepository.save(detalle);
        }

        // 11. Registrar movimiento de caja (ingreso)
        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setEmpresa(empresa);
        movimiento.setCaja(caja);
        movimiento.setFormaPago(formaPago);
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setTipo(TipoMovimientoCaja.INGRESO);
        movimiento.setMonto(savedFactura.getTotal());
        movimiento.setDescripcion("Venta factura #" + savedFactura.getNumero());
        movimiento.setTipoReferencia(TipoReferenciaMovimientoCaja.FACTURA_VENTA);
        movimiento.setReferenciaId(savedFactura.getId());
        movimientoCajaRepository.save(movimiento);

        // 12. Actualizar saldo de caja
        caja.setSaldoActual(caja.getSaldoActual().add(savedFactura.getTotal()));
        cajaRepository.save(caja);

        // 13. Crear cuenta por cobrar (si tiene cliente)
        if (cliente != null) {
            CuentaPorCobrar cuenta = new CuentaPorCobrar();
            cuenta.setEmpresa(empresa);
            cuenta.setCliente(cliente);
            cuenta.setFacturaVenta(savedFactura);
            cuenta.setMontoOriginal(savedFactura.getTotal());
            cuenta.setSaldo(savedFactura.getTotal());
            cuenta.setFechaVencimiento(LocalDateTime.now().plusDays(30));
            cuenta.setEstado(EstadoCuenta.ABIERTA);
            // Aquí se debería guardar con cuentaPorCobrarRepository
        }

        return facturaVentaMapper.toResponse(savedFactura);
    }

    @Override
    public FacturaVentaResponse actualizarEstado(Long id, FacturaVentaUpdateRequest request) {
        FacturaVenta entity = facturaVentaRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));

        entity.setEstado(request.estado());
        FacturaVenta saved = facturaVentaRepository.save(entity);
        return facturaVentaMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        FacturaVenta entity = facturaVentaRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));
        softDelete(entity);
        facturaVentaRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacturaVentaResponse> obtenerVentasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return facturaVentaRepository.findByEmpresaAndFechaBetween(empresaId, inicio, fin)
            .stream()
            .map(facturaVentaMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerTotalVentasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return facturaVentaRepository.findByEmpresaAndFechaBetween(empresaId, inicio, fin)
            .stream()
            .map(FacturaVenta::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
