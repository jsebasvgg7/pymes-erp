package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pronostico_demanda")
public class PronosticoDemanda extends BaseEntity {

    public PronosticoDemanda() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "semana_pronosticada", nullable = false)
    private LocalDate semanaPronosticada;

    @Column(name = "unidades_proyectadas", nullable = false, precision = 10, scale = 2)
    private BigDecimal unidadesProyectadas;

    @Column(name = "version_modelo", nullable = false, length = 50)
    private String versionModelo;

    @Column(name = "fecha_calculo", nullable = false)
    private LocalDateTime fechaCalculo;

    public Empresa getEmpresa() {
        return empresa;
    }

    public Producto getProducto() {
        return producto;
    }

    public LocalDate getSemanaPronosticada() {
        return semanaPronosticada;
    }

    public BigDecimal getUnidadesProyectadas() {
        return unidadesProyectadas;
    }

    public String getVersionModelo() {
        return versionModelo;
    }

    public LocalDateTime getFechaCalculo() {
        return fechaCalculo;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public void setSemanaPronosticada(LocalDate semanaPronosticada) {
        this.semanaPronosticada = semanaPronosticada;
    }

    public void setUnidadesProyectadas(BigDecimal unidadesProyectadas) {
        this.unidadesProyectadas = unidadesProyectadas;
    }

    public void setVersionModelo(String versionModelo) {
        this.versionModelo = versionModelo;
    }

    public void setFechaCalculo(LocalDateTime fechaCalculo) {
        this.fechaCalculo = fechaCalculo;
    }
}