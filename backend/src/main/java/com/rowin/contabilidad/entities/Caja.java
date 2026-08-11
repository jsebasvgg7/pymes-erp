package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "caja")
public class Caja extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal saldoInicial = BigDecimal.ZERO;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal saldoActual = BigDecimal.ZERO;

	@OneToMany(mappedBy = "caja")
	private List<MovimientoCaja> movimientos = new ArrayList<>();

	protected Caja() {
	}
}

