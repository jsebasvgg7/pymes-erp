package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "impuesto")
public class Impuesto extends BaseEntity {

    public Impuesto() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoImpuesto tipo;

    @Column(nullable = false, precision = 7, scale = 4)
    private BigDecimal porcentaje;

    @ManyToMany(mappedBy = "impuestos")
    private Set<Producto> productos = new HashSet<>();

    @ManyToMany(mappedBy = "impuestos")
    private Set<DetalleFactura> detallesFactura = new HashSet<>();

    @ManyToMany(mappedBy = "impuestos")
    private Set<DetalleCompra> detallesCompra = new HashSet<>();

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public String getNombre() {
        return nombre;
    }

    public TipoImpuesto getTipo() {
        return tipo;
    }

    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    public Set<Producto> getProductos() {
        return productos;
    }

    public Set<DetalleFactura> getDetallesFactura() {
        return detallesFactura;
    }

    public Set<DetalleCompra> getDetallesCompra() {
        return detallesCompra;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setTipo(TipoImpuesto tipo) {
        this.tipo = tipo;
    }

    public void setPorcentaje(BigDecimal porcentaje) {
        this.porcentaje = porcentaje;
    }

    public void setProductos(Set<Producto> productos) {
        this.productos = productos;
    }

    public void setDetallesFactura(Set<DetalleFactura> detallesFactura) {
        this.detallesFactura = detallesFactura;
    }

    public void setDetallesCompra(Set<DetalleCompra> detallesCompra) {
        this.detallesCompra = detallesCompra;
    }
}
