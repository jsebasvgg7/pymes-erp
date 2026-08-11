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
@Table(name = "compra")
public class Compra extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "proveedor_id", nullable = false)
	private Proveedor proveedor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "forma_pago_id")
	private FormaPago formaPago;

	@Column(nullable = false, length = 60)
	private String numeroDocumento;

	@Column(nullable = false)
	private LocalDateTime fechaCompra;

	@Column
	private LocalDateTime fechaVencimiento;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private CompraEstado estado = CompraEstado.BORRADOR;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal subtotal = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal totalImpuestos = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal total = BigDecimal.ZERO;

	@OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<DetalleCompra> detalles = new ArrayList<>();

	@OneToOne(mappedBy = "compra")
	private CuentaPorPagar cuentaPorPagar;

	protected Compra() {
	}
}

