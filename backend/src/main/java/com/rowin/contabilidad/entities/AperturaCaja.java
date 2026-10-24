package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "apertura_caja")
public class AperturaCaja extends BaseEntity {

    public AperturaCaja() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caja_id", nullable = false)
    private Caja caja;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoAperturaCaja estado = EstadoAperturaCaja.ABIERTA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_apertura_id", nullable = false)
    private Usuario usuarioApertura;

    @Column(nullable = false)
    private LocalDateTime fechaApertura;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal efectivoInicial = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_cierre_id")
    private Usuario usuarioCierre;

    @Column
    private LocalDateTime fechaCierre;

    @Column(precision = 19, scale = 2)
    private BigDecimal efectivoEsperado;

    @Column(precision = 19, scale = 2)
    private BigDecimal efectivoContado;

    @Column(precision = 19, scale = 2)
    private BigDecimal diferencia;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoCierreCaja tipoCierre;

    public Empresa getEmpresa() {
        return empresa;
    }

    public Caja getCaja() {
        return caja;
    }

    public EstadoAperturaCaja getEstado() {
        return estado;
    }

    public Usuario getUsuarioApertura() {
        return usuarioApertura;
    }

    public LocalDateTime getFechaApertura() {
        return fechaApertura;
    }

    public BigDecimal getEfectivoInicial() {
        return efectivoInicial;
    }

    public Usuario getUsuarioCierre() {
        return usuarioCierre;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public BigDecimal getEfectivoEsperado() {
        return efectivoEsperado;
    }

    public BigDecimal getEfectivoContado() {
        return efectivoContado;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public TipoCierreCaja getTipoCierre() {
        return tipoCierre;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setCaja(Caja caja) {
        this.caja = caja;
    }

    public void setEstado(EstadoAperturaCaja estado) {
        this.estado = estado;
    }

    public void setUsuarioApertura(Usuario usuarioApertura) {
        this.usuarioApertura = usuarioApertura;
    }

    public void setFechaApertura(LocalDateTime fechaApertura) {
        this.fechaApertura = fechaApertura;
    }

    public void setEfectivoInicial(BigDecimal efectivoInicial) {
        this.efectivoInicial = efectivoInicial;
    }

    public void setUsuarioCierre(Usuario usuarioCierre) {
        this.usuarioCierre = usuarioCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public void setEfectivoEsperado(BigDecimal efectivoEsperado) {
        this.efectivoEsperado = efectivoEsperado;
    }

    public void setEfectivoContado(BigDecimal efectivoContado) {
        this.efectivoContado = efectivoContado;
    }

    public void setDiferencia(BigDecimal diferencia) {
        this.diferencia = diferencia;
    }

    public void setTipoCierre(TipoCierreCaja tipoCierre) {
        this.tipoCierre = tipoCierre;
    }
}
