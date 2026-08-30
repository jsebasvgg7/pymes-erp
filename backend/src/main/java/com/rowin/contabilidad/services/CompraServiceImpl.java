package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.compra.CompraCreateRequest;
import com.rowin.contabilidad.dto.compra.CompraResponse;
import com.rowin.contabilidad.dto.compra.CompraUpdateRequest;
import com.rowin.contabilidad.dto.detallecompra.DetalleCompraRequest;
import com.rowin.contabilidad.entities.*;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.*;
import com.rowin.contabilidad.utils.mappers.CompraMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class CompraServiceImpl extends BaseCrudService implements CompraService {

    private final CompraRepository compraRepository;
    private final DetalleCompraRepository detalleCompraRepository;
    private final EmpresaRepository empresaRepository;
    private final ProveedorRepository proveedorRepository;
    private final FormaPagoRepository formaPagoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final ImpuestoRepository impuestoRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final CajaRepository cajaRepository;
    private final CompraMapper compraMapper;

    public CompraServiceImpl(
        CompraRepository compraRepository,
        DetalleCompraRepository detalleCompraRepository,
        EmpresaRepository empresaRepository,
        ProveedorRepository proveedorRepository,
        FormaPagoRepository formaPagoRepository,
        ProductoRepository productoRepository,
        InventarioRepository inventarioRepository,
        ImpuestoRepository impuestoRepository,
        MovimientoCajaRepository movimientoCajaRepository,
        CajaRepository cajaRepository,
        CompraMapper compraMapper
    ) {
        this.compraRepository = compraRepository;
        this.detalleCompraRepository = detalleCompraRepository;
        this.empresaRepository = empresaRepository;
        this.proveedorRepository = proveedorRepository;
        this.formaPagoRepository = formaPagoRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.impuestoRepository = impuestoRepository;
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.cajaRepository = cajaRepository;
        this.compraMapper = compraMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompraResponse> listar(Pageable pageable) {
        return compraRepository.findByActiveTrue(pageable)
            .map(compraMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompraResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return compraRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(compraMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CompraResponse> listarPorEmpresaYProveedor(Long empresaId, Long proveedorId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        Proveedor proveedor = getByIdOrThrow(proveedorRepository, proveedorId, "Proveedor");
        if (!isActive(proveedor)) {
            throw new ResourceNotFoundException("Proveedor no encontrado: " + proveedorId);
        }

        return compraRepository.findByActiveTrueAndEmpresaIdAndProveedorId(pageable, empresaId, proveedorId)
            .map(compraMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CompraResponse obtenerPorId(Long id) {
        Compra entity = compraRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada: " + id));
        return compraMapper.toResponse(entity);
    }

    @Override
    public CompraResponse crear(CompraCreateRequest request) {
        // 1. Validar empresa
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        // 2. Validar proveedor
        Proveedor proveedor = getByIdOrThrow(proveedorRepository, request.proveedorId(), "Proveedor");
        if (!isActive(proveedor)) {
            throw new ResourceNotFoundException("Proveedor no encontrado: " + request.proveedorId());
        }

        // 3. Validar forma de pago (opcional)
        FormaPago formaPago = null;
        if (request.formaPagoId() != null) {
            formaPago = getByIdOrThrow(formaPagoRepository, request.formaPagoId(), "FormaPago");
            if (!isActive(formaPago)) {
                throw new ResourceNotFoundException("Forma de pago no encontrada: " + request.formaPagoId());
            }
        }

        // 4. Validar que haya detalles
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new IllegalArgumentException("La compra debe tener al menos un detalle");
        }

        // 5. Obtener caja activa para la empresa
        Caja caja = cajaRepository.findByEmpresaIdAndActiveTrue(empresa.getId())
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("No hay una caja activa para esta empresa"));

        // 6. Crear la compra
        Compra compra = compraMapper.toEntity(request);
        compra.setEmpresa(empresa);
        compra.setProveedor(proveedor);
        compra.setFormaPago(formaPago);
        compra.setFechaCompra(request.fechaCompra() != null ? request.fechaCompra() : LocalDateTime.now());
        compra.setEstado(CompraEstado.REGISTRADA);

        // Generar número de compra (formato: COM-YYYYMMDD-XXXXX)
        String maxNumero = compraRepository.findMaxNumeroDocumentoByEmpresa(empresa.getId());
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
        String numero = String.format("COM-%tY%<tm%<td-%05d", LocalDateTime.now(), secuencia);
        compra.setNumeroDocumento(numero);

        // 7. Procesar detalles y calcular totales
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalImpuestos = BigDecimal.ZERO;
        List<DetalleCompra> detalles = new ArrayList<>();

        for (DetalleCompraRequest detalleReq : request.detalles()) {
            DetalleCompra detalle = new DetalleCompra();
            detalle.setCompra(compra);
            detalle.setDescripcion(detalleReq.descripcion());
            detalle.setCantidad(detalleReq.cantidad());
            detalle.setCostoUnitario(detalleReq.costoUnitario());

            // Si tiene producto, actualizar inventario (sumar stock)
            if (detalleReq.productoId() != null) {
                Producto producto = getByIdOrThrow(productoRepository, detalleReq.productoId(), "Producto");
                if (!isActive(producto)) {
                    throw new ResourceNotFoundException("Producto no encontrado: " + detalleReq.productoId());
                }

                detalle.setProducto(producto);

                // Actualizar inventario (sumar stock)
                Inventario inventario = inventarioRepository.findByProductoIdAndActiveTrue(producto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado para el producto: " + producto.getId()));

                inventario.setCantidadActual(inventario.getCantidadActual().add(detalleReq.cantidad()));

                // Actualizar costo promedio
                BigDecimal nuevoCostoPromedio = inventario.getCostoPromedio()
                    .multiply(inventario.getCantidadActual().subtract(detalleReq.cantidad()))
                    .add(detalleReq.cantidad().multiply(detalleReq.costoUnitario()))
                    .divide(inventario.getCantidadActual(), 2, java.math.RoundingMode.HALF_UP);
                inventario.setCostoPromedio(nuevoCostoPromedio);
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
                            .multiply(detalleReq.costoUnitario())
                            .multiply(impuesto.getPorcentaje().divide(new BigDecimal(100)));
                        totalImpuestos = totalImpuestos.add(impuestoMonto);
                    }
                    detalle.setImpuestos(impuestos);
                }
            }

            // Calcular total del detalle
            BigDecimal totalLinea = detalleReq.cantidad().multiply(detalleReq.costoUnitario());
            detalle.setTotalLinea(totalLinea);
            subtotal = subtotal.add(totalLinea);

            detalles.add(detalle);
        }

        // 8. Actualizar totales de la compra
        compra.setSubtotal(subtotal);
        compra.setTotalImpuestos(totalImpuestos);
        compra.setTotal(subtotal.add(totalImpuestos));

        // 9. Guardar compra
        Compra savedCompra = compraRepository.save(compra);

        // 10. Guardar detalles
        for (DetalleCompra detalle : detalles) {
            detalle.setCompra(savedCompra);
            detalleCompraRepository.save(detalle);
        }

        // 11. Registrar movimiento de caja (egreso)
        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setEmpresa(empresa);
        movimiento.setCaja(caja);
        movimiento.setFormaPago(formaPago);
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setTipo(TipoMovimientoCaja.EGRESO);
        movimiento.setMonto(savedCompra.getTotal());
        movimiento.setDescripcion("Compra #" + savedCompra.getNumeroDocumento());
        movimiento.setTipoReferencia(TipoReferenciaMovimientoCaja.COMPRA);
        movimiento.setReferenciaId(savedCompra.getId());
        movimientoCajaRepository.save(movimiento);

        // 12. Actualizar saldo de caja
        caja.setSaldoActual(caja.getSaldoActual().subtract(savedCompra.getTotal()));
        cajaRepository.save(caja);

        return compraMapper.toResponse(savedCompra);
    }

    @Override
    public CompraResponse actualizar(Long id, CompraUpdateRequest request) {
        Compra entity = compraRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada: " + id));

        if (request.estado() != null) {
            entity.setEstado(request.estado());
        }
        if (request.fechaVencimiento() != null) {
            entity.setFechaVencimiento(request.fechaVencimiento());
        }

        Compra saved = compraRepository.save(entity);
        return compraMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        Compra entity = compraRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada: " + id));
        softDelete(entity);
        compraRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompraResponse> obtenerComprasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return compraRepository.findByEmpresaAndFechaBetween(empresaId, inicio, fin)
            .stream()
            .map(compraMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerTotalComprasPorPeriodo(Long empresaId, LocalDateTime inicio, LocalDateTime fin) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return compraRepository.findByEmpresaAndFechaBetween(empresaId, inicio, fin)
            .stream()
            .map(Compra::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
