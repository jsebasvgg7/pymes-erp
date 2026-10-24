package com.rowin.contabilidad.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import com.rowin.contabilidad.dto.detalle.DetalleFacturaRequest;
import com.rowin.contabilidad.dto.factura.CategoriaVentaResponse;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Optional;

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
    private final CuentaPorCobrarRepository cuentaPorCobrarRepository;
    private final AperturaCajaService aperturaCajaService;
    private final ConfiguracionEmpresaRepository configuracionEmpresaRepository;

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
        FacturaVentaMapper facturaVentaMapper,
        CuentaPorCobrarRepository cuentaPorCobrarRepository,
        AperturaCajaService aperturaCajaService,
        ConfiguracionEmpresaRepository configuracionEmpresaRepository
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
        this.cuentaPorCobrarRepository = cuentaPorCobrarRepository;
        this.aperturaCajaService = aperturaCajaService;
        this.configuracionEmpresaRepository = configuracionEmpresaRepository;
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

        if (cliente != null && !cliente.getEmpresa().getId().equals(empresa.getId())) {
            throw new IllegalArgumentException("El cliente no pertenece a la empresa de la venta.");
        }
        if (!formaPago.getEmpresa().getId().equals(empresa.getId())) {
            throw new IllegalArgumentException("La forma de pago no pertenece a la empresa de la venta.");
        }

        Optional<ConfiguracionEmpresa> configuracion = configuracionEmpresaRepository.findByEmpresaId(empresa.getId());
        boolean esCredito = formaPago.getTipo() == TipoFormaPago.CREDITO;
        if (esCredito && cliente == null) {
            throw new IllegalArgumentException("El cliente es obligatorio para ventas a crédito.");
        }
        if (cliente == null && configuracion.map(ConfiguracionEmpresa::isClienteObligatorio).orElse(false)) {
            throw new IllegalArgumentException("El cliente es obligatorio en todas las ventas.");
        }

        // 4. Validar que haya detalles
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new IllegalArgumentException("La factura debe tener al menos un detalle");
        }

        AperturaCaja apertura = aperturaCajaService.exigirAperturaDeEmpresa(empresa.getId());
        Caja caja = apertura.getCaja();

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
            validarDecimalesDeCantidad(detalleReq.cantidad());
            detalle.setDescripcion(detalleReq.descripcion());
            detalle.setCantidad(detalleReq.cantidad());
            detalle.setPrecioUnitario(detalleReq.precioUnitario());

            // Si tiene producto, validar stock y actualizar inventario
            if (detalleReq.productoId() != null) {
                Producto producto = getByIdOrThrow(productoRepository, detalleReq.productoId(), "Producto");
                if (!isActive(producto)) {
                    throw new ResourceNotFoundException("Producto no encontrado: " + detalleReq.productoId());
                }

                validarUnidadDeCantidad(producto, detalleReq.cantidad());

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
                        BigDecimal impuestoMonto = redondearMoneda(detalleReq.cantidad()
                            .multiply(detalleReq.precioUnitario())
                            .multiply(impuesto.getPorcentaje().divide(new BigDecimal(100))));
                        totalImpuestos = totalImpuestos.add(impuestoMonto);
                    }
                    detalle.setImpuestos(impuestos);
                }
            }

            // Calcular total del detalle
            BigDecimal totalLinea = redondearMoneda(detalleReq.cantidad().multiply(detalleReq.precioUnitario()));
            detalle.setTotalLinea(totalLinea);
            subtotal = subtotal.add(totalLinea);

            detalles.add(detalle);
        }

        // 8. Aplicar descuento y actualizar totales de la factura
        BigDecimal descuento = request.descuento() == null ? BigDecimal.ZERO : request.descuento();
        if (descuento.signum() < 0) {
            throw new IllegalArgumentException("El descuento no puede ser negativo");
        }
        if (descuento.compareTo(subtotal) > 0) {
            throw new IllegalArgumentException("El descuento no puede superar el subtotal de la venta");
        }

        factura.setSubtotal(subtotal);
        factura.setDescuento(descuento);
        factura.setTotalImpuestos(totalImpuestos);
        factura.setTotal(subtotal.subtract(descuento).add(totalImpuestos));

        // 9. Guardar factura
        FacturaVenta savedFactura = facturaVentaRepository.save(factura);

        // 10. Guardar detalles
        for (DetalleFactura detalle : detalles) {
            detalle.setFacturaVenta(savedFactura);
            detalleFacturaRepository.save(detalle);
        }
        savedFactura.getDetalles().addAll(detalles);

        // 11 y 12. Una venta a crédito no mueve la caja: el dinero entra con los abonos
        if (!esCredito) {
            MovimientoCaja movimiento = new MovimientoCaja();
            movimiento.setEmpresa(empresa);
            movimiento.setCaja(caja);
            movimiento.setFormaPago(formaPago);
            movimiento.setApertura(apertura);
            movimiento.setFecha(LocalDateTime.now());
            movimiento.setTipo(TipoMovimientoCaja.INGRESO);
            movimiento.setMonto(savedFactura.getTotal());
            movimiento.setDescripcion("Venta factura #" + savedFactura.getNumero());
            movimiento.setTipoReferencia(TipoReferenciaMovimientoCaja.FACTURA_VENTA);
            movimiento.setReferenciaId(savedFactura.getId());
            movimientoCajaRepository.save(movimiento);

            caja.setSaldoActual(caja.getSaldoActual().add(savedFactura.getTotal()));
            cajaRepository.save(caja);
        }

        // 13. Crear cuenta por cobrar (si es crédito)
        if (esCredito) {
            CuentaPorCobrar cuenta = new CuentaPorCobrar();
            cuenta.setEmpresa(empresa);
            cuenta.setCliente(cliente);
            cuenta.setFacturaVenta(savedFactura);
            cuenta.setMontoOriginal(savedFactura.getTotal());
            cuenta.setSaldo(savedFactura.getTotal());
            Integer diasCredito = configuracion.map(ConfiguracionEmpresa::getDiasVencimientoCredito).orElse(null);
            cuenta.setFechaVencimiento(diasCredito == null ? null : LocalDateTime.now().plusDays(diasCredito));
            cuenta.setEstado(EstadoCuenta.ABIERTA);

            cuentaPorCobrarRepository.save(cuenta);
        }

        return facturaVentaMapper.toResponse(savedFactura);
    }

    @Override
    public FacturaVentaResponse actualizarEstado(Long id, FacturaVentaUpdateRequest request) {
        FacturaVenta entity = facturaVentaRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));

        if (request.estado() == FacturaEstado.PAGADA && entity.getEstado() != FacturaEstado.PAGADA) {
            Optional<CuentaPorCobrar> cuentaOpt = cuentaPorCobrarRepository.findByFacturaVentaIdAndActiveTrue(entity.getId());
            if (cuentaOpt.isPresent() && cuentaOpt.get().getSaldo().signum() > 0) {
                throw new IllegalArgumentException("La factura tiene saldo pendiente: registra el pago como abono del cliente.");
            }
        }

        if (request.estado() == FacturaEstado.ANULADA && entity.getEstado() != FacturaEstado.ANULADA) {
            Optional<CuentaPorCobrar> cuentaOpt = cuentaPorCobrarRepository.findByFacturaVentaIdAndActiveTrue(entity.getId());
            if (cuentaOpt.isPresent()) {
                CuentaPorCobrar cuenta = cuentaOpt.get();
                cuenta.setSaldo(BigDecimal.ZERO);
                cuenta.setEstado(EstadoCuenta.CERRADA);
                cuentaPorCobrarRepository.save(cuenta);
            }
        }

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

        return facturaVentaRepository.sumTotalByEmpresaAndFechaBetween(empresaId, inicio, fin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaVentaResponse> obtenerVentasPorCategoria(Long empresaId, LocalDateTime inicio, LocalDateTime fin) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return facturaVentaRepository.sumVentasPorCategoria(empresaId, inicio, fin)
            .stream()
            .map(row -> new CategoriaVentaResponse((String) row[0], row[1] instanceof BigDecimal bd ? bd : new BigDecimal(row[1].toString())))
            .toList();
    }

        @Override
    @Transactional(readOnly = true)
    public List<com.rowin.contabilidad.dto.factura.VentaSemanalProductoResponse> obtenerHistorialSemanal(Long empresaId, int semanas) {
        if (semanas < 1 || semanas > 104) {
            throw new IllegalArgumentException("El número de semanas debe estar entre 1 y 104");
        }
        LocalDate semanaActual = com.rowin.contabilidad.utils.HistorialSemanal.inicioSemana(LocalDate.now());
        LocalDate semanaInicial = semanaActual.minusWeeks(semanas - 1L);
        LocalDateTime inicio = semanaInicial.atStartOfDay();
        LocalDateTime fin = semanaActual.plusDays(6).atTime(LocalTime.MAX);

        List<com.rowin.contabilidad.utils.HistorialSemanal.Linea> lineas = facturaVentaRepository
            .findLineasVentaParaHistorial(empresaId, FacturaEstado.VENTAS_VALIDAS, inicio, fin)
            .stream()
            .map(r -> new com.rowin.contabilidad.utils.HistorialSemanal.Linea(
                (LocalDateTime) r[0], (FacturaEstado) r[1], (Long) r[2], (String) r[3],
                (java.math.BigDecimal) r[4], (java.math.BigDecimal) r[5],
                (java.math.BigDecimal) r[6], (java.math.BigDecimal) r[7]))
            .toList();

        java.util.Map<Long, LocalDateTime> primeraVenta = new java.util.HashMap<>();
        for (Object[] r : facturaVentaRepository.findPrimeraVentaPorProducto(empresaId, FacturaEstado.VENTAS_VALIDAS)) {
            primeraVenta.put((Long) r[0], (LocalDateTime) r[1]);
        }

        return com.rowin.contabilidad.utils.HistorialSemanal.agrupar(lineas, semanaInicial, semanaActual, primeraVenta);
    }

    private static final int MAX_DECIMALES_CANTIDAD = 3;

    private void validarDecimalesDeCantidad(BigDecimal cantidad) {
        if (cantidad.stripTrailingZeros().scale() > MAX_DECIMALES_CANTIDAD) {
            throw new IllegalArgumentException("La cantidad admite máximo " + MAX_DECIMALES_CANTIDAD + " decimales.");
        }
    }

    private void validarUnidadDeCantidad(Producto producto, BigDecimal cantidad) {
        boolean esDecimal = cantidad.stripTrailingZeros().scale() > 0;
        UnidadMedida unidad = producto.getUnidadMedida();
        if (esDecimal && (unidad == null || !unidad.permiteDecimales())) {
            throw new IllegalArgumentException("El producto " + producto.getNombre() + " no admite cantidades decimales.");
        }
    }

    private static BigDecimal redondearMoneda(BigDecimal valor) {
        return valor.scale() > 2 ? valor.setScale(2, RoundingMode.HALF_UP) : valor;
    }
}
