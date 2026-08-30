package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "producto")
public class Producto extends BaseEntity {

    public Producto() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private CategoriaProducto categoria;

    @Column(length = 60)
    private String sku;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UnidadMedida unidadMedida = UnidadMedida.UNIDAD;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal costo = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    @ManyToMany
    @JoinTable(
        name = "producto_impuesto",
        joinColumns = @JoinColumn(name = "producto_id"),
        inverseJoinColumns = @JoinColumn(name = "impuesto_id")
    )
    private Set<Impuesto> impuestos = new HashSet<>();

    @OneToOne(mappedBy = "producto")
    private Inventario inventario;

    @OneToMany(mappedBy = "producto")
    private List<DetalleFactura> detallesFactura = new ArrayList<>();

    @OneToMany(mappedBy = "producto")
    private List<DetalleCompra> detallesCompra = new ArrayList<>();

    // ========== GETTERS ==========

    public Empresa getEmpresa() {
        return empresa;
    }

    public CategoriaProducto getCategoria() {
        return categoria;
    }

    public String getSku() {
        return sku;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public UnidadMedida getUnidadMedida() {
        return unidadMedida;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public BigDecimal getCosto() {
        return costo;
    }

    public BigDecimal getStockMinimo() {
        return stockMinimo;
    }

    public Set<Impuesto> getImpuestos() {
        return impuestos;
    }

    public Inventario getInventario() {
        return inventario;
    }

    public List<DetalleFactura> getDetallesFactura() {
        return detallesFactura;
    }

    public List<DetalleCompra> getDetallesCompra() {
        return detallesCompra;
    }

    // ========== SETTERS ==========

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setCategoria(CategoriaProducto categoria) {
        this.categoria = categoria;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setUnidadMedida(UnidadMedida unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public void setPrecioVenta(BigDecimal precioVenta) {
        this.precioVenta = precioVenta;
    }

    public void setCosto(BigDecimal costo) {
        this.costo = costo;
    }

    public void setStockMinimo(BigDecimal stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public void setImpuestos(Set<Impuesto> impuestos) {
        this.impuestos = impuestos;
    }

    public void setInventario(Inventario inventario) {
        this.inventario = inventario;
    }

    public void setDetallesFactura(List<DetalleFactura> detallesFactura) {
        this.detallesFactura = detallesFactura;
    }

    public void setDetallesCompra(List<DetalleCompra> detallesCompra) {
        this.detallesCompra = detallesCompra;
    }
}
