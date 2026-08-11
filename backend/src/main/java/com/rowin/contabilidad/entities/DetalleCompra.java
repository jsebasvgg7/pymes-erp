package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "detalle_compra")
public class DetalleCompra extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "compra_id", nullable = false)
	private Compra compra;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "producto_id")
	private Producto producto;

	@Column(nullable = false, length = 255)
	private String descripcion;

	@Column(nullable = false, precision = 19, scale = 3)
	private BigDecimal cantidad = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal costoUnitario = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal totalLinea = BigDecimal.ZERO;

	@ManyToMany
	@JoinTable(
		name = "detalle_compra_impuesto",
		joinColumns = @JoinColumn(name = "detalle_compra_id"),
		inverseJoinColumns = @JoinColumn(name = "impuesto_id")
	)
	private Set<Impuesto> impuestos = new HashSet<>();

	protected DetalleCompra() {
	}
}

