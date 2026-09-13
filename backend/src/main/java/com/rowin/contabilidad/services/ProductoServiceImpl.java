package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.producto.ProductoCreateRequest;
import com.rowin.contabilidad.dto.producto.ProductoResponse;
import com.rowin.contabilidad.dto.producto.ProductoUpdateRequest;
import com.rowin.contabilidad.entities.*;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.*;
import com.rowin.contabilidad.utils.mappers.ProductoMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class ProductoServiceImpl extends BaseCrudService implements ProductoService {

    private final ProductoRepository productoRepository;
    private final EmpresaRepository empresaRepository;
    private final CategoriaProductoRepository categoriaProductoRepository;
    private final InventarioRepository inventarioRepository;
    private final ImpuestoRepository impuestoRepository;
    private final ProductoMapper productoMapper;

    public ProductoServiceImpl(
        ProductoRepository productoRepository,
        EmpresaRepository empresaRepository,
        CategoriaProductoRepository categoriaProductoRepository,
        InventarioRepository inventarioRepository,
        ImpuestoRepository impuestoRepository,
        ProductoMapper productoMapper
    ) {
        this.productoRepository = productoRepository;
        this.empresaRepository = empresaRepository;
        this.categoriaProductoRepository = categoriaProductoRepository;
        this.inventarioRepository = inventarioRepository;
        this.impuestoRepository = impuestoRepository;
        this.productoMapper = productoMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponse> listar(Pageable pageable) {
        return productoRepository.findByActiveTrue(pageable)
            .map(productoMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return productoRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(productoMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponse> listarPorEmpresaYCategoria(Long empresaId, Long categoriaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        CategoriaProducto categoria = getByIdOrThrow(categoriaProductoRepository, categoriaId, "CategoriaProducto");
        if (!isActive(categoria)) {
            throw new ResourceNotFoundException("Categoría no encontrada: " + categoriaId);
        }

        return productoRepository.findByActiveTrueAndEmpresaIdAndCategoriaId(pageable, empresaId, categoriaId)
            .map(productoMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        Producto entity = productoRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
        return productoMapper.toResponse(entity);
    }

    @Override
    public ProductoResponse crear(ProductoCreateRequest request) {
        // 1. Validar empresa
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        // 2. Validar categoría (opcional)
        CategoriaProducto categoria = null;
        if (request.categoriaId() != null) {
            categoria = getByIdOrThrow(categoriaProductoRepository, request.categoriaId(), "CategoriaProducto");
            if (!isActive(categoria)) {
                throw new ResourceNotFoundException("Categoría no encontrada: " + request.categoriaId());
            }
        }

        // 3. Validar SKU único (opcional)
        if (request.sku() != null && !request.sku().isBlank()) {
            if (productoRepository.existsByEmpresaIdAndSkuAndActiveTrue(request.empresaId(), request.sku())) {
                throw new IllegalArgumentException("Ya existe un producto con el SKU: " + request.sku());
            }
        }

        // 4. Crear producto
        Producto producto = productoMapper.toEntity(request, empresa, categoria);

        // 5. Asignar impuestos (opcional)
        if (request.impuestoIds() != null && !request.impuestoIds().isEmpty()) {
            Set<Impuesto> impuestos = new HashSet<>();
            for (Long impuestoId : request.impuestoIds()) {
                Impuesto impuesto = getByIdOrThrow(impuestoRepository, impuestoId, "Impuesto");
                if (!isActive(impuesto)) {
                    throw new ResourceNotFoundException("Impuesto no encontrado: " + impuestoId);
                }
                impuestos.add(impuesto);
            }
            producto.setImpuestos(impuestos);
        }

        // 6. Guardar producto
        Producto savedProducto = productoRepository.save(producto);

        // 7. Crear inventario inicial
        Inventario inventario = new Inventario();
        inventario.setEmpresa(empresa);
        inventario.setProducto(savedProducto);
        inventario.setCantidadActual(request.stockInicial() != null ? request.stockInicial() : BigDecimal.ZERO);
        inventario.setCostoPromedio(request.costo() != null ? request.costo() : BigDecimal.ZERO);
        Inventario savedInventario = inventarioRepository.save(inventario);

        // Asociar el lado inverso de la relación @OneToOne en memoria: Hibernate no lo
        // hace automáticamente solo porque el Inventario ya tiene la FK guardada, y
        // productoMapper.toResponse() lee stockActual/costoPromedio desde
        // savedProducto.getInventario(), que sin esta línea queda null.
        savedProducto.setInventario(savedInventario);

        return productoMapper.toResponse(savedProducto);
    }

    @Override
    public ProductoResponse actualizar(Long id, ProductoUpdateRequest request) {
        // 1. Validar producto existe
        Producto entity = productoRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));

        // 2. Actualizar campos básicos
        productoMapper.updateEntity(request, entity);

        // 3. Actualizar impuestos (opcional)
        if (request.impuestoIds() != null) {
            Set<Impuesto> impuestos = new HashSet<>();
            for (Long impuestoId : request.impuestoIds()) {
                Impuesto impuesto = getByIdOrThrow(impuestoRepository, impuestoId, "Impuesto");
                if (!isActive(impuesto)) {
                    throw new ResourceNotFoundException("Impuesto no encontrado: " + impuestoId);
                }
                impuestos.add(impuesto);
            }
            entity.setImpuestos(impuestos);
        }

        // 4. Guardar producto
        Producto saved = productoRepository.save(entity);
        return productoMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        Producto entity = productoRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));

        // Soft delete del producto
        softDelete(entity);
        productoRepository.save(entity);

        // Soft delete del inventario asociado
        inventarioRepository.findByProductoIdAndActiveTrue(id)
            .ifPresent(inventario -> {
                softDelete(inventario);
                inventarioRepository.save(inventario);
            });
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> obtenerProductosConStockBajo(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return productoRepository.findLowStockProducts(empresaId)
            .stream()
            .map(productoMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> obtenerProductosSinStock(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return productoRepository.findOutOfStockProducts(empresaId)
            .stream()
            .map(productoMapper::toResponse)
            .toList();
    }
}