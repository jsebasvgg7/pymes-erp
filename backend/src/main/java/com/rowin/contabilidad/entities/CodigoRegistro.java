package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "codigo_registro")
public class CodigoRegistro extends BaseEntity {

    public CodigoRegistro() {
    }

    @Column(nullable = false, length = 64, unique = true, updatable = false)
    private String codigoHash;

    @Column(length = 200)
    private String nota;

    @Column(nullable = false)
    private LocalDateTime expiraEn;

    private LocalDateTime usadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    public String getCodigoHash() {
        return codigoHash;
    }

    public String getNota() {
        return nota;
    }

    public LocalDateTime getExpiraEn() {
        return expiraEn;
    }

    public LocalDateTime getUsadoEn() {
        return usadoEn;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public void setCodigoHash(String codigoHash) {
        this.codigoHash = codigoHash;
    }

    public void setNota(String nota) {
        this.nota = nota;
    }

    public void setExpiraEn(LocalDateTime expiraEn) {
        this.expiraEn = expiraEn;
    }

    public void setUsadoEn(LocalDateTime usadoEn) {
        this.usadoEn = usadoEn;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }
}
