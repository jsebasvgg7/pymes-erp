import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import Modal from "../components/Modal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import DataTable, { DataTableLayout } from "../components/DataTable";
import { authService } from "../services/authService";
import { http } from "../services/http";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import "./RolesPage.css";

type RolResponse = {
	id: number;
	nombre: string;
	descripcion: string;
	modulos: string[];
};

type RolFormState = {
	nombre: string;
	descripcion: string;
	modulos: string[];
};

const MODULOS_DISPONIBLES: { clave: string; etiqueta: string }[] = [
	{ clave: "DASHBOARD", etiqueta: "Panel principal" },
	{ clave: "CLIENTES", etiqueta: "Clientes" },
	{ clave: "PROVEEDORES", etiqueta: "Proveedores" },
	{ clave: "PRODUCTOS", etiqueta: "Productos" },
	{ clave: "CATEGORIAS", etiqueta: "Categorías" },
	{ clave: "COMPRAS", etiqueta: "Compras" },
	{ clave: "INVENTARIO", etiqueta: "Inventario y pronósticos" },
	{ clave: "POS", etiqueta: "Punto de venta" },
	{ clave: "CAJA", etiqueta: "Caja" },
	{ clave: "REPORTES", etiqueta: "Reportes" },
	{ clave: "CONFIGURACION", etiqueta: "Configuración" },
	{ clave: "USUARIOS", etiqueta: "Usuarios" },
	{ clave: "ROLES", etiqueta: "Roles y permisos" }
];

const defaultForm: RolFormState = { nombre: "", descripcion: "", modulos: [] };

function mensajeDeError(err: unknown): string {
	const mensaje = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
	return mensaje || "No se pudo guardar el rol. Revisa los datos e intenta nuevamente.";
}

export default function RolesPage() {
	const empresaId = authService.getUsuario()?.empresaId;
	const [roles, setRoles] = useState<RolResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ErrorPagina | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [form, setForm] = useState<RolFormState>(defaultForm);
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const loadRoles = useCallback(async () => {
		if (!empresaId) {
			setError(errorSesion("roles"));
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { data } = await http.get(`/api/roles/listar-por-empresa/${empresaId}`);
			setRoles(data.content || data);
		} catch (err) {
			setError(describirError("roles", err));
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadRoles();
	}, [loadRoles]);

	const openCreateModal = () => {
		setEditId(null);
		setForm(defaultForm);
		setFormError(null);
		setModalOpen(true);
	};

	const openEditModal = (rol: RolResponse) => {
		setEditId(rol.id);
		setForm({ nombre: rol.nombre, descripcion: rol.descripcion || "", modulos: rol.modulos || [] });
		setFormError(null);
		setModalOpen(true);
	};

	const closeModal = () => {
		if (saving) return;
		setModalOpen(false);
	};

	const handleToggleModulo = (modulo: string) => {
		setForm((prev) => ({
			...prev,
			modulos: prev.modulos.includes(modulo) ? prev.modulos.filter((m) => m !== modulo) : [...prev.modulos, modulo]
		}));
	};

	const todosMarcados = form.modulos.length === MODULOS_DISPONIBLES.length;

	const handleToggleTodos = () => {
		setForm((prev) => ({
			...prev,
			modulos: todosMarcados ? [] : MODULOS_DISPONIBLES.map((m) => m.clave)
		}));
	};

	const isFormValid = useMemo(() => form.nombre.trim().length > 0, [form.nombre]);

	const handleSave = async () => {
		if (!isFormValid || saving) return;

		setSaving(true);
		setFormError(null);
		try {
			const payload = { ...form, nombre: form.nombre.trim(), empresaId };
			if (editId) {
				await http.put(`/api/roles/actualizar/${editId}`, payload);
			} else {
				await http.post("/api/roles/crear", payload);
			}
			setModalOpen(false);
			await loadRoles();
		} catch (err) {
			setFormError(mensajeDeError(err));
		} finally {
			setSaving(false);
		}
	};

	const layout: DataTableLayout<RolResponse> = {
		principal: (r) => r.nombre,
		secundario: (r) => r.descripcion || "Sin descripción",
		etiquetas: (r) => {
			if (r.nombre === "ADMIN") return <span className="rol__tag rol__tag--full">Acceso total</span>;
			const total = r.modulos ? r.modulos.length : 0;
			return <span className="rol__tag">{total} {total === 1 ? "módulo" : "módulos"}</span>;
		},
		estado: () => null,
		valor: (r) =>
			r.nombre === "ADMIN" ? null : (
				<div className="rol__actions">
					<button type="button" className="rol__iconBtn" aria-label={`Editar rol ${r.nombre}`} onClick={() => openEditModal(r)}>
						<Edit2 size={14} strokeWidth={2} />
					</button>
				</div>
			)
	};

	if (loading) {
		return (
			<div className="rol">
				<LoadingState label="Cargando roles..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rol">
				<ErrorState pagina="roles" error={error} onRetry={loadRoles} />
			</div>
		);
	}

	return (
		<div className="rol">
			<PageHeader
				title="Roles y permisos"
				subtitle="Crea perfiles de acceso y decide qué puede ver cada usuario."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={14} strokeWidth={2.2} />
						<span>Nuevo rol</span>
					</PrimaryButton>
				}
			/>

			<DataTable
				data={roles}
				layout={layout}
				title="Roles activos"
				count={roles.length}
				pageSize={10}
				emptyState={
					<div className="rol__empty">
						<div className="rol__emptyTitle">No hay roles creados.</div>
						<div className="rol__emptySubtitle">Crea el primer rol para asignarlo a tus usuarios.</div>
					</div>
				}
			/>

			<Modal
				open={modalOpen}
				size="md"
				title={editId ? "Editar rol" : "Crear nuevo rol"}
				subtitle="Elige los paneles que podrá abrir quien tenga este rol."
				icon={<ShieldCheck size={20} strokeWidth={2} />}
				onClose={closeModal}
				footer={
					<div className="rol__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!isFormValid || saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="rol__form" onSubmit={(e) => e.preventDefault()}>
					<div className="rol__field">
						<label className="rol__label" htmlFor="rol-nombre">
							Nombre del rol <span className="rol__req">*</span>
						</label>
						<input
							id="rol-nombre"
							className="rol__input"
							value={form.nombre}
							placeholder="Ej. Cajero"
							onChange={(e) => setForm({ ...form, nombre: e.target.value })}
						/>
					</div>

					<div className="rol__field">
						<label className="rol__label" htmlFor="rol-descripcion">
							Descripción
						</label>
						<input
							id="rol-descripcion"
							className="rol__input"
							value={form.descripcion}
							placeholder="Opcional"
							onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
						/>
					</div>

					<div className="rol__field">
						<div className="rol__modulesHead">
							<span className="rol__label">Paneles permitidos</span>
							<span className="rol__count">
								{form.modulos.length} de {MODULOS_DISPONIBLES.length}
							</span>
							<button type="button" className="rol__link" onClick={handleToggleTodos}>
								{todosMarcados ? "Quitar todos" : "Marcar todos"}
							</button>
						</div>
						<div className="rol__modules">
							{MODULOS_DISPONIBLES.map((mod) => {
								const activo = form.modulos.includes(mod.clave);
								return (
									<label key={mod.clave} className={`rol__module${activo ? " rol__module--on" : ""}`}>
										<input type="checkbox" checked={activo} onChange={() => handleToggleModulo(mod.clave)} />
										{mod.etiqueta}
									</label>
								);
							})}
						</div>
					</div>

					{formError ? <div className="rol__formError">{formError}</div> : null}
				</form>
			</Modal>
		</div>
	);
}
