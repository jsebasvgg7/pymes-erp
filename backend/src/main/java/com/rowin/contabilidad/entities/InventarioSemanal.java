package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Stock de un producto registrado una vez por semana (lunes a domingo). */
@Entity
@Table(name = "inventario_semanal")
public class InventarioSemanal extends BaseEntity {

    public InventarioSemanal() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private LocalDate semanaInicio;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidad = BigDecimal.ZERO;

    public Empresa getEmpresa() {
        return empresa;
    }

    public Producto getProducto() {
        return producto;
    }

    public LocalDate getSemanaInicio() {
        return semanaInicio;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setSemanaInicio(LocalDate semanaInicio) {
        this.semanaInicio = semanaInicio;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }
}