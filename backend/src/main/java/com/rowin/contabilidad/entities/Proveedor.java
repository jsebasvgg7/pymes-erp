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

	protected Proveedor() {
	}
}

