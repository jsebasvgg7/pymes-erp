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

    public FacturaVenta() {

    }

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

	// =========getters========

	public Empresa getEmpresa() {
		return empresa;
	}

	public Cliente getCliente() {
		return cliente;
	}

	public FormaPago getFormaPago() {
		return formaPago;
	}

	public String getNumero() {
		return numero;
	}

	public LocalDateTime getFechaEmision() {
		return fechaEmision;
	}

	public LocalDateTime getFechaVencimiento() {
		return fechaVencimiento;
	}

	public FacturaEstado getEstado() {
		return estado;
	}

	public BigDecimal getSubtotal() {
		return subtotal;
	}

	public BigDecimal getTotalImpuestos() {
		return totalImpuestos;
	}

	public BigDecimal getTotal() {
		return total;
	}

	public List<DetalleFactura> getDetalles() {
		return detalles;
	}

	public CuentaPorCobrar getCuentaPorCobrar() {
		return cuentaPorCobrar;
	}

	// =========setters========

	public void setEmpresa(Empresa empresa) {
		this.empresa = empresa;
	}

	public void setCliente(Cliente cliente) {
		this.cliente = cliente;
	}

	public void setFormaPago(FormaPago formaPago) {
		this.formaPago = formaPago;
	}

	public void setNumero(String numero) {
		this.numero = numero;
	}

	public void setFechaEmision(LocalDateTime fechaEmision) {
		this.fechaEmision = fechaEmision;
	}

	public void setFechaVencimiento(LocalDateTime fechaVencimiento) {
		this.fechaVencimiento = fechaVencimiento;
	}

	public void setEstado(FacturaEstado estado) {
		this.estado = estado;
	}

	public void setSubtotal(BigDecimal subtotal) {
		this.subtotal = subtotal;
	}

	public void setTotalImpuestos(BigDecimal totalImpuestos) {
		this.totalImpuestos = totalImpuestos;
	}

	public void setTotal(BigDecimal total) {
		this.total = total;
	}

	public void setDetalles(List<DetalleFactura> detalles) {
		this.detalles = detalles;
	}

	public void setCuentaPorCobrar(CuentaPorCobrar cuentaPorCobrar) {
		this.cuentaPorCobrar = cuentaPorCobrar;
	}
}
