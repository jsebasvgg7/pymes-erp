package com.rowin.contabilidad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "configuracion_empresa")
@Getter
@Setter
public class ConfiguracionEmpresa extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false, unique = true)
    private Empresa empresa;

    @Column(nullable = false, length = 3)
    private String moneda = "COP";

    @Column(nullable = false, length = 5)
    private String simboloMoneda = "$";

    @Column(nullable = false, length = 20)
    private String formatoFecha = "DD/MM/AAAA";

    @Column(nullable = false)
    private boolean clienteObligatorio = false;

    @Column(nullable = false)
    private int diasVencimientoCredito = 30;

    @Column(nullable = false)
    private boolean codigoBarrasActivo = false;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal stockMinimoDefecto = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean avisarStockBajo = true;

    @Column(nullable = false)
    private LocalTime horaCierreAutomatico = LocalTime.of(4, 0);

    @Column(nullable = false)
    private int anchoRecibo = 58;

    @Column(length = 150)
    private String nombreRecibo;

    @Column(length = 255)
    private String mensajePieRecibo;

    public ConfiguracionEmpresa() {
    }
}
