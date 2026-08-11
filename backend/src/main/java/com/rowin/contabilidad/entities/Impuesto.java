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
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "impuesto")
@Getter
@Setter
public class Impuesto extends BaseEntity {
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

	public Impuesto() {
	}
}
