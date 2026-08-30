package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cuenta_por_pagar")
public class CuentaPorPagar extends BaseEntity {

    public CuentaPorPagar() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id", unique = true)
    private Compra compra;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montoOriginal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal saldo = BigDecimal.ZERO;

    @Column
    private LocalDateTime fechaVencimiento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoCuenta estado = EstadoCuenta.ABIERTA;

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public Compra getCompra() {
        return compra;
    }

    public BigDecimal getMontoOriginal() {
        return montoOriginal;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public LocalDateTime getFechaVencimiento() {
        return fechaVencimiento;
    }

    public EstadoCuenta getEstado() {
        return estado;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public void setCompra(Compra compra) {
        this.compra = compra;
    }

    public void setMontoOriginal(BigDecimal montoOriginal) {
        this.montoOriginal = montoOriginal;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }

    public void setFechaVencimiento(LocalDateTime fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public void setEstado(EstadoCuenta estado) {
        this.estado = estado;
    }
}
