package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "empresa")
@Getter
@Setter
public class Empresa extends BaseEntity {
	@Column(nullable = false, length = 200)
	private String nombre;

	@Column(length = 50)
	private String nit;

	@Column(length = 255)
	private String direccion;

	@Column(length = 50)
	private String telefono;

	@Column(length = 150)
	private String email;

	@OneToMany(mappedBy = "empresa")
	private List<Usuario> usuarios = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Rol> roles = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Cliente> clientes = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Proveedor> proveedores = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<CategoriaProducto> categoriasProducto = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Producto> productos = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<FacturaVenta> facturasVenta = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Compra> compras = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Caja> cajas = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<FormaPago> formasPago = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<Impuesto> impuestos = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<CuentaPorCobrar> cuentasPorCobrar = new ArrayList<>();

	@OneToMany(mappedBy = "empresa")
	private List<CuentaPorPagar> cuentasPorPagar = new ArrayList<>();

	public Empresa() {
	}
}
