package com.rowin.contabilidad.entities;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "rol")
@Getter
@Setter
public class Rol extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "empresa_id", nullable = false)
	private Empresa empresa;

	@Column(nullable = false, length = 80)
	private String nombre;

	@Column(length = 255)
	private String descripcion;

	// Guardar los paneles permitidos
	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "rol_modulos", joinColumns = @JoinColumn(name = "rol_id"))
	@Column(name = "modulo")
	private Set<String> modulos = new HashSet<>();

	@ManyToMany(mappedBy = "roles")
	private Set<Usuario> usuarios = new HashSet<>();

	public Rol() {
	}
}