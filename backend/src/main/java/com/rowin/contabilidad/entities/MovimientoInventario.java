package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_inventario")
public class MovimientoInventario extends BaseEntity {

    public MovimientoInventario() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimientoInventario tipo;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidadAnterior = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal cantidadNueva = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal diferencia = BigDecimal.ZERO;

    @Column(nullable = false, length = 120)
    private String motivo;

    @Column(length = 500)
    private String notas;

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public Producto getProducto() {
        return producto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public TipoMovimientoInventario getTipo() {
        return tipo;
    }

    public BigDecimal getCantidadAnterior() {
        return cantidadAnterior;
    }

    public BigDecimal getCantidadNueva() {
        return cantidadNueva;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public String getMotivo() {
        return motivo;
    }

    public String getNotas() {
        return notas;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public void setTipo(TipoMovimientoInventario tipo) {
        this.tipo = tipo;
    }

    public void setCantidadAnterior(BigDecimal cantidadAnterior) {
        this.cantidadAnterior = cantidadAnterior;
    }

    public void setCantidadNueva(BigDecimal cantidadNueva) {
        this.cantidadNueva = cantidadNueva;
    }

    public void setDiferencia(BigDecimal diferencia) {
        this.diferencia = diferencia;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
