package com.rowin.contabilidad.entities;

public enum UnidadMedida {
	UNIDAD,
	KILOGRAMO,
	GRAMO,
	LITRO,
	MILILITRO,
	CAJA,
	PAQUETE,
	HORA,
	SERVICIO;

	public boolean permiteDecimales() {
		return this == KILOGRAMO || this == GRAMO || this == LITRO || this == MILILITRO;
	}
}
