package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cuenta_por_pagar")
public class CuentaPorPagar extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "proveedor_id", nullable = false)
	private Proveedor proveedor;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "compra_id", unique = true)
	private Compra compra;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal montoOriginal = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal saldo = BigDecimal.ZERO;

	@Column
	private LocalDateTime fechaVencimiento;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoCuenta estado = EstadoCuenta.ABIERTA;

	protected CuentaPorPagar() {
	}
}

