package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_caja")
public class MovimientoCaja extends BaseEntity {

    public MovimientoCaja() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caja_id", nullable = false)
    private Caja caja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forma_pago_id")
    private FormaPago formaPago;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimientoCaja tipo;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal monto = BigDecimal.ZERO;

    @Column(length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoReferenciaMovimientoCaja tipoReferencia = TipoReferenciaMovimientoCaja.AJUSTE;

    @Column
    private Long referenciaId;

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public Caja getCaja() {
        return caja;
    }

    public FormaPago getFormaPago() {
        return formaPago;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public TipoMovimientoCaja getTipo() {
        return tipo;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public TipoReferenciaMovimientoCaja getTipoReferencia() {
        return tipoReferencia;
    }

    public Long getReferenciaId() {
        return referenciaId;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setCaja(Caja caja) {
        this.caja = caja;
    }

    public void setFormaPago(FormaPago formaPago) {
        this.formaPago = formaPago;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public void setTipo(TipoMovimientoCaja tipo) {
        this.tipo = tipo;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setTipoReferencia(TipoReferenciaMovimientoCaja tipoReferencia) {
        this.tipoReferencia = tipoReferencia;
    }

    public void setReferenciaId(Long referenciaId) {
        this.referenciaId = referenciaId;
    }
}
