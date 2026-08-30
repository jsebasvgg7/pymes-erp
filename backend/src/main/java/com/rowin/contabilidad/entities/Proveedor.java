package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "proveedor")
public class Proveedor extends BaseEntity {

    public Proveedor() {
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 60)
    private String documento;

    @Column(length = 50)
    private String telefono;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String direccion;

    @OneToMany(mappedBy = "proveedor")
    private List<Compra> compras = new ArrayList<>();

    @OneToMany(mappedBy = "proveedor")
    private List<CuentaPorPagar> cuentasPorPagar = new ArrayList<>();

    // ========== GETTERS ==========
    public Empresa getEmpresa() {
        return empresa;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDocumento() {
        return documento;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getEmail() {
        return email;
    }

    public String getDireccion() {
        return direccion;
    }

    public List<Compra> getCompras() {
        return compras;
    }

    public List<CuentaPorPagar> getCuentasPorPagar() {
        return cuentasPorPagar;
    }

    // ========== SETTERS ==========
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public void setCompras(List<Compra> compras) {
        this.compras = compras;
    }

    public void setCuentasPorPagar(List<CuentaPorPagar> cuentasPorPagar) {
        this.cuentasPorPagar = cuentasPorPagar;
    }
}
