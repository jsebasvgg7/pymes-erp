package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "detalle_factura")
public class DetalleFactura extends BaseEntity {

    public DetalleFactura() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factura_venta_id", nullable = false)
    private FacturaVenta facturaVenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidad = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal precioUnitario = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalLinea = BigDecimal.ZERO;

    @ManyToMany
    @JoinTable(
        name = "detalle_factura_impuesto",
        joinColumns = @JoinColumn(name = "detalle_factura_id"),
        inverseJoinColumns = @JoinColumn(name = "impuesto_id")
    )
    private Set<Impuesto> impuestos = new HashSet<>();

    // ========== GETTERS ==========
    public FacturaVenta getFacturaVenta() {
        return facturaVenta;
    }

    public Producto getProducto() {
        return producto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public BigDecimal getTotalLinea() {
        return totalLinea;
    }

    public Set<Impuesto> getImpuestos() {
        return impuestos;
    }

    // ========== SETTERS ==========
    public void setFacturaVenta(FacturaVenta facturaVenta) {
        this.facturaVenta = facturaVenta;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public void setTotalLinea(BigDecimal totalLinea) {
        this.totalLinea = totalLinea;
    }

    public void setImpuestos(Set<Impuesto> impuestos) {
        this.impuestos = impuestos;
    }
}
