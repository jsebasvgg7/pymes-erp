package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_caja")
public class MovimientoCaja extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "caja_id", nullable = false)
	private Caja caja;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "forma_pago_id")
	private FormaPago formaPago;

	@Column(nullable = false)
	private LocalDateTime fecha;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TipoMovimientoCaja tipo;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal monto = BigDecimal.ZERO;

	@Column(length = 255)
	private String descripcion;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private TipoReferenciaMovimientoCaja tipoReferencia = TipoReferenciaMovimientoCaja.AJUSTE;

	@Column
	private Long referenciaId;

	protected MovimientoCaja() {
	}
}

