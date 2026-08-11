package com.rowin.contabilidad.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "factura_venta")
public class FacturaVenta extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "cliente_id", nullable = false)
	private Cliente cliente;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "forma_pago_id")
	private FormaPago formaPago;

	@Column(nullable = false, length = 40)
	private String numero;

	@Column(nullable = false)
	private LocalDateTime fechaEmision;

	@Column
	private LocalDateTime fechaVencimiento;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private FacturaEstado estado = FacturaEstado.BORRADOR;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal subtotal = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal totalImpuestos = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal total = BigDecimal.ZERO;

	@OneToMany(mappedBy = "facturaVenta", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<DetalleFactura> detalles = new ArrayList<>();

	@OneToOne(mappedBy = "facturaVenta")
	private CuentaPorCobrar cuentaPorCobrar;

	protected FacturaVenta() {
	}
}

