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
@Table(name = "detalle_factura")
public class DetalleFactura extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "factura_venta_id", nullable = false)
	private FacturaVenta facturaVenta;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "producto_id")
	private Producto producto;

	@Column(nullable = false, length = 255)
	private String descripcion;

	@Column(nullable = false, precision = 19, scale = 3)
	private BigDecimal cantidad = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal precioUnitario = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal totalLinea = BigDecimal.ZERO;

	@ManyToMany
	@JoinTable(
		name = "detalle_factura_impuesto",
		joinColumns = @JoinColumn(name = "detalle_factura_id"),
		inverseJoinColumns = @JoinColumn(name = "impuesto_id")
	)
	private Set<Impuesto> impuestos = new HashSet<>();

	protected DetalleFactura() {
	}
}

