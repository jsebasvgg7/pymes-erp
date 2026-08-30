package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "inventario")
public class Inventario extends BaseEntity {

    public Inventario() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false, unique = true)
    private Producto producto;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidadActual = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal costoPromedio = BigDecimal.ZERO;

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public Producto getProducto() {
        return producto;
    }

    public BigDecimal getCantidadActual() {
        return cantidadActual;
    }

    public BigDecimal getCostoPromedio() {
        return costoPromedio;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setCantidadActual(BigDecimal cantidadActual) {
        this.cantidadActual = cantidadActual;
    }

    public void setCostoPromedio(BigDecimal costoPromedio) {
        this.costoPromedio = costoPromedio;
    }
}
