package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.inventario.AjusteStockRequest;
import com.rowin.contabilidad.dto.inventario.InventarioResponse;
import com.rowin.contabilidad.dto.inventario.MovimientoInventarioResponse;
import com.rowin.contabilidad.entities.*;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.*;
import com.rowin.contabilidad.utils.mappers.MovimientoInventarioMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventarioServiceImpl extends BaseCrudService implements InventarioService {

    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final EmpresaRepository empresaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoInventarioMapper movimientoInventarioMapper;

    public InventarioServiceImpl(
        InventarioRepository inventarioRepository,
        MovimientoInventarioRepository movimientoInventarioRepository,
        EmpresaRepository empresaRepository,
        ProductoRepository productoRepository,
        UsuarioRepository usuarioRepository,
        MovimientoInventarioMapper movimientoInventarioMapper
    ) {
        this.inventarioRepository = inventarioRepository;
        this.movimientoInventarioRepository = movimientoInventarioRepository;
        this.empresaRepository = empresaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimientoInventarioMapper = movimientoInventarioMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioResponse> listarPorEmpresa(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        // Listar todos los productos activos de la empresa y mapear su inventario
        List<Producto> productos = productoRepository.findByEmpresaIdAndActiveTrue(empresaId);

        return productos.stream()
            .map(this::toInventarioResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InventarioResponse obtenerPorProducto(Long productoId) {
        Producto producto = getByIdOrThrow(productoRepository, productoId, "Producto");
        if (!isActive(producto)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + productoId);
        }

        Inventario inventario = inventarioRepository.findByProductoIdAndActiveTrue(productoId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado para el producto: " + productoId));

        return toInventarioResponseFromInventario(inventario, producto);
    }

    @Override
    public InventarioResponse ajustarStock(AjusteStockRequest request) {
        // 1. Validar empresa
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        // 2. Validar producto
        Producto producto = getByIdOrThrow(productoRepository, request.productoId(), "Producto");
        if (!isActive(producto)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + request.productoId());
        }

        // 3. Validar inventario
        Inventario inventario = inventarioRepository.findByProductoIdAndActiveTrue(producto.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado para el producto: " + producto.getId()));

        // 4. Validar usuario (opcional)
        Usuario usuario = null;
        if (request.usuarioId() != null) {
            usuario = getByIdOrThrow(usuarioRepository, request.usuarioId(), "Usuario");
        }

        // 5. Calcular la nueva cantidad según el tipo
        BigDecimal cantidadAnterior = inventario.getCantidadActual();
        BigDecimal cantidadNueva;
        BigDecimal diferencia;

        switch (request.tipo()) {
            case ENTRADA -> {
                cantidadNueva = cantidadAnterior.add(request.cantidad());
                diferencia = request.cantidad();
            }
            case SALIDA -> {
                if (cantidadAnterior.compareTo(request.cantidad()) < 0) {
                    throw new IllegalArgumentException(
                        "Stock insuficiente para dar salida. Disponible: " + cantidadAnterior +
                        ", Solicitado: " + request.cantidad()
                    );
                }
                cantidadNueva = cantidadAnterior.subtract(request.cantidad());
                diferencia = request.cantidad().negate();
            }
            case CONTEO -> {
                cantidadNueva = request.cantidad();
                diferencia = cantidadNueva.subtract(cantidadAnterior);
            }
            default -> throw new IllegalArgumentException("Tipo de movimiento inválido: " + request.tipo());
        }

        // 6. Actualizar inventario
        inventario.setCantidadActual(cantidadNueva);
        inventarioRepository.save(inventario);

        // 7. Registrar movimiento de inventario (auditoría)
        MovimientoInventario movimiento = movimientoInventarioMapper.toEntity(empresa, producto, usuario);
        movimiento.setTipo(request.tipo());
        movimiento.setCantidadAnterior(cantidadAnterior);
        movimiento.setCantidadNueva(cantidadNueva);
        movimiento.setDiferencia(diferencia);
        movimiento.setMotivo(request.motivo());
        movimiento.setNotas(request.notas());
        movimientoInventarioRepository.save(movimiento);

        return toInventarioResponseFromInventario(inventario, producto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoInventarioResponse> obtenerMovimientosPorProducto(Long productoId) {
        Producto producto = getByIdOrThrow(productoRepository, productoId, "Producto");
        if (!isActive(producto)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + productoId);
        }

        return movimientoInventarioRepository.findByProductoIdAndActiveTrue(productoId)
            .stream()
            .map(movimientoInventarioMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovimientoInventarioResponse> listarMovimientosPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return movimientoInventarioRepository.findByEmpresaIdAndActiveTrue(empresaId, pageable)
            .map(movimientoInventarioMapper::toResponse);
    }

    // ========== HELPERS ==========

    private InventarioResponse toInventarioResponse(Producto producto) {
        Inventario inventario = inventarioRepository.findByProductoIdAndActiveTrue(producto.getId())
            .orElse(null);

        if (inventario == null) {
            // Producto sin inventario (no debería pasar, pero por si acaso)
            return new InventarioResponse(
                null, null, null, true,
                producto.getEmpresa().getId(),
                producto.getId(), producto.getNombre(), producto.getSku(),
                producto.getCategoria() != null ? producto.getCategoria().getNombre() : null,
                producto.getUnidadMedida().name(),
                BigDecimal.ZERO, BigDecimal.ZERO, producto.getStockMinimo(), producto.getPrecioVenta(),
                true
            );
        }

        return toInventarioResponseFromInventario(inventario, producto);
    }

    private InventarioResponse toInventarioResponseFromInventario(Inventario inventario, Producto producto) {
        boolean stockBajo = inventario.getCantidadActual().compareTo(producto.getStockMinimo()) <= 0;

        return new InventarioResponse(
            inventario.getId(),
            inventario.getCreatedAt(),
            inventario.getUpdatedAt(),
            inventario.isActive(),
            producto.getEmpresa().getId(),
            producto.getId(),
            producto.getNombre(),
            producto.getSku(),
            producto.getCategoria() != null ? producto.getCategoria().getNombre() : null,
            producto.getUnidadMedida().name(),
            inventario.getCantidadActual(),
            inventario.getCostoPromedio(),
            producto.getStockMinimo(),
            producto.getPrecioVenta(),
            stockBajo
        );
    }
}
