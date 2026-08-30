package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "detalle_compra")
public class DetalleCompra extends BaseEntity {

    public DetalleCompra() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id", nullable = false)
    private Compra compra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidad = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal costoUnitario = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalLinea = BigDecimal.ZERO;

    @ManyToMany
    @JoinTable(
        name = "detalle_compra_impuesto",
        joinColumns = @JoinColumn(name = "detalle_compra_id"),
        inverseJoinColumns = @JoinColumn(name = "impuesto_id")
    )
    private Set<Impuesto> impuestos = new HashSet<>();

    // ========== GETTERS ==========
    public Compra getCompra() {
        return compra;
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

    public BigDecimal getCostoUnitario() {
        return costoUnitario;
    }

    public BigDecimal getTotalLinea() {
        return totalLinea;
    }

    public Set<Impuesto> getImpuestos() {
        return impuestos;
    }

    // ========== SETTERS ==========
    public void setCompra(Compra compra) {
        this.compra = compra;
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

    public void setCostoUnitario(BigDecimal costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public void setTotalLinea(BigDecimal totalLinea) {
        this.totalLinea = totalLinea;
    }

    public void setImpuestos(Set<Impuesto> impuestos) {
        this.impuestos = impuestos;
    }
}
