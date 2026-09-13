import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { rolService, type Rol } from "../services/rolService";
import { usuarioService, type Usuario } from "../services/usuarioService";
import "./UsuariosPage.css";

type UserFilter = "Todos" | "Activos" | "Inactivos";

type UserFormState = {
	username: string;
	email: string;
	password: string;
	rolIds: number[];
};

const defaultFormState: UserFormState = {
	username: "",
	email: "",
	password: "",
	rolIds: []
};

function formatDateTime(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function normalizeText(value: string) {
	return value.trim().toLowerCase();
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export default function UsuariosPage() {
	const empresaId = authService.getUsuario()?.empresaId;
	const currentUserId = authService.getUsuario()?.id;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [users, setUsers] = useState<Usuario[]>([]);
	const [roles, setRoles] = useState<Rol[]>([]);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingUserId, setEditingUserId] = useState<number | null>(null);
	const [form, setForm] = useState<UserFormState>(defaultFormState);
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [selectedFilter, setSelectedFilter] = useState<UserFilter>("Todos");
	const [searchText, setSearchText] = useState("");

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<{ id: number; nextActive: boolean } | null>(null);

	const searchRef = useRef<HTMLDivElement | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [usuariosData, rolesData] = await Promise.all([
				usuarioService.listarPorEmpresa(empresaId, 0, 200),
				rolService.listarPorEmpresa(empresaId, 0, 200)
			]);
			setUsers(usuariosData.content);
			setRoles(rolesData.content.filter((r) => r.active));
		} catch {
			setError("No se pudo cargar la información de usuarios. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		const container = searchRef.current;
		if (!container) return;
		const input = container.querySelector("input");
		if (!input) return;

		const handler = () => setSearchText(input.value);
		input.addEventListener("input", handler);
		return () => input.removeEventListener("input", handler);
	}, []);

	const openCreateModal = () => {
		setEditingUserId(null);
		setForm(defaultFormState);
		setFormError(null);
		setModalOpen(true);
	};

	const openEditModal = useCallback((user: Usuario) => {
		setEditingUserId(user.id);
		setForm({
			username: user.username,
			email: user.email,
			password: "",
			rolIds: user.roles.map((r) => r.id)
		});
		setFormError(null);
		setModalOpen(true);
	}, []);

	const closeModal = () => {
		if (saving) return;
		setModalOpen(false);
	};

	const toggleRol = (rolId: number) => {
		setForm((v) => ({
			...v,
			rolIds: v.rolIds.includes(rolId) ? v.rolIds.filter((id) => id !== rolId) : [...v.rolIds, rolId]
		}));
	};

	const isFormValid = useMemo(() => {
		const usernameOk = form.username.trim().length > 0;
		const emailOk = form.email.trim().length > 0;
		const passwordOk = editingUserId ? form.password.trim().length === 0 || form.password.trim().length >= 6 : form.password.trim().length >= 6;
		return usernameOk && emailOk && passwordOk;
	}, [editingUserId, form.email, form.password, form.username]);

	const handleSave = async () => {
		if (!isFormValid || !empresaId) return;

		setSaving(true);
		setFormError(null);
		try {
			if (!editingUserId) {
				const created = await usuarioService.crear({
					empresaId,
					username: form.username.trim(),
					email: form.email.trim(),
					password: form.password.trim(),
					rolIds: form.rolIds
				});
				setUsers((prev) => [...prev, created]);
			} else {
				const updated = await usuarioService.actualizar(editingUserId, {
					username: form.username.trim(),
					email: form.email.trim(),
					password: form.password.trim() || undefined,
					rolIds: form.rolIds
				});
				setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
			}
			setModalOpen(false);
		} catch (err) {
			setFormError(extractErrorMessage(err, "No se pudo guardar el usuario. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	};

	const openConfirmStatusChange = useCallback((user: Usuario) => {
		setConfirmTarget({ id: user.id, nextActive: !user.active });
		setConfirmOpen(true);
	}, []);

	const closeConfirm = () => {
		setConfirmOpen(false);
		setConfirmTarget(null);
	};

	const confirmStatusChange = async () => {
		if (!confirmTarget) return;
		try {
			await usuarioService.cambiarEstado(confirmTarget.id, confirmTarget.nextActive);
			setUsers((prev) => prev.map((u) => (u.id === confirmTarget.id ? { ...u, active: confirmTarget.nextActive } : u)));
		} catch {
			setError("No se pudo cambiar el estado del usuario. Intenta nuevamente.");
		} finally {
			closeConfirm();
		}
	};

	const filteredUsers = useMemo(() => {
		const q = normalizeText(searchText);
		return users.filter((u) => {
			const matchesFilter =
				selectedFilter === "Todos" ||
				(selectedFilter === "Activos" && u.active) ||
				(selectedFilter === "Inactivos" && !u.active);

			if (!matchesFilter) return false;
			if (!q) return true;

			const haystack = `${u.username} ${u.email}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [searchText, selectedFilter, users]);

	const columns: Array<DataTableColumn<Usuario>> = useMemo(
		() => [
			{
				key: "avatar",
				header: "",
				render: (r) => (
					<div className="usr__avatarCell" aria-hidden="true">
						{r.username.trim().slice(0, 1).toUpperCase()}
					</div>
				)
			},
			{ key: "username", header: "Usuario", render: (r) => r.username },
			{ key: "email", header: "Correo", render: (r) => r.email },
			{
				key: "roles",
				header: "Roles",
				render: (r) => (r.roles.length > 0 ? r.roles.map((rol) => rol.nombre).join(", ") : "Sin rol asignado")
			},
			{ key: "active", header: "Estado", render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} /> },
			{ key: "updatedAt", header: "Última actualización", render: (r) => formatDateTime(r.updatedAt) },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="usr__actions">
						<SecondaryButton type="button" className="usr__actionBtn" onClick={() => openEditModal(r)}>
							Editar
						</SecondaryButton>
						{r.id === currentUserId ? null : r.active ? (
							<SecondaryButton
								type="button"
								className="usr__actionBtn usr__actionBtn--danger"
								onClick={() => openConfirmStatusChange(r)}
							>
								Desactivar
							</SecondaryButton>
						) : (
							<SecondaryButton type="button" className="usr__actionBtn" onClick={() => openConfirmStatusChange(r)}>
								Activar
							</SecondaryButton>
						)}
					</div>
				)
			}
		],
		[currentUserId, openConfirmStatusChange, openEditModal]
	);

	if (loading) {
		return (
			<div className="usr">
				<LoadingState label="Cargando usuarios..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="usr">
				<div className="usr__state usr__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="usr">
			<PageHeader
				title="Usuarios"
				subtitle="Administra los usuarios que podrán acceder al sistema."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={16} strokeWidth={2} /> Nuevo Usuario
					</PrimaryButton>
				}
			/>

			{roles.length === 0 ? (
				<div className="usr__state">
					No hay roles creados para tu empresa todavía. Crea al menos un rol desde{" "}
					<code>POST /api/roles/crear</code> antes de asignar roles a los usuarios; puedes crear usuarios sin rol mientras tanto.
				</div>
			) : null}

			<div className="usr__controls">
				<div className="usr__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar usuario..." />
					</div>
				</div>
				<div className="usr__filters" aria-label="Filtro visual">
					<SecondaryButton
						type="button"
						className={["usr__filterBtn", selectedFilter === "Todos" ? "usr__filterBtn--active" : ""].join(" ")}
						onClick={() => setSelectedFilter("Todos")}
					>
						Todos
					</SecondaryButton>
					<SecondaryButton
						type="button"
						className={["usr__filterBtn", selectedFilter === "Activos" ? "usr__filterBtn--active" : ""].join(" ")}
						onClick={() => setSelectedFilter("Activos")}
					>
						Activos
					</SecondaryButton>
					<SecondaryButton
						type="button"
						className={["usr__filterBtn", selectedFilter === "Inactivos" ? "usr__filterBtn--active" : ""].join(" ")}
						onClick={() => setSelectedFilter("Inactivos")}
					>
						Inactivos
					</SecondaryButton>
				</div>
			</div>

			<div className="usr__table">
				<DataTable
					columns={columns}
					data={filteredUsers}
					emptyState={
						users.length === 0 ? (
							<div className="usr__empty">
								<div className="usr__emptyTitle">No hay usuarios registrados.</div>
								<div className="usr__emptySubtitle">Crea el primer usuario del sistema.</div>
							</div>
						) : (
							<div className="usr__empty">
								<div className="usr__emptyTitle">No se encontraron usuarios.</div>
								<div className="usr__emptySubtitle">Prueba modificando la búsqueda o el filtro.</div>
							</div>
						)
					}
				/>
			</div>

			<Modal
				open={modalOpen}
				title={editingUserId ? "Editar Usuario" : "Nuevo Usuario"}
				onClose={closeModal}
				footer={
					<div className="usr__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!isFormValid || saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="usr__form" onSubmit={(e) => e.preventDefault()}>
					{formError ? <div className="usr__formError">{formError}</div> : null}

					<div className="usr__grid">
						<div className="usr__field">
							<label className="usr__label">Nombre de usuario *</label>
							<input
								className="usr__input"
								type="text"
								value={form.username}
								onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))}
							/>
						</div>

						<div className="usr__field">
							<label className="usr__label">Correo electrónico *</label>
							<input
								className="usr__input"
								type="email"
								value={form.email}
								onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
							/>
						</div>

						<div className="usr__field usr__field--full">
							<label className="usr__label">
								{editingUserId ? "Nueva contraseña (dejar en blanco para no cambiarla)" : "Contraseña *"}
							</label>
							<input
								className="usr__input"
								type="password"
								placeholder="Mínimo 6 caracteres"
								value={form.password}
								onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
							/>
						</div>

						<div className="usr__field usr__field--full">
							<label className="usr__label">Roles</label>
							{roles.length === 0 ? (
								<div className="usr__emptySubtitle">No hay roles disponibles para tu empresa.</div>
							) : (
								<div className="usr__rolesGrid">
									{roles.map((rol) => (
										<label key={rol.id} className="usr__roleOption">
											<input
												type="checkbox"
												checked={form.rolIds.includes(rol.id)}
												onChange={() => toggleRol(rol.id)}
											/>
											<span>{rol.nombre}</span>
										</label>
									))}
								</div>
							)}
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title={confirmTarget?.nextActive ? "Activar usuario" : "Desactivar usuario"}
				message={
					confirmTarget?.nextActive
						? "¿Deseas volver a activar este usuario?"
						: "¿Deseas desactivar este usuario? No podrá iniciar sesión mientras esté inactivo."
				}
				confirmText={confirmTarget?.nextActive ? "Activar" : "Desactivar"}
				cancelText="Cancelar"
				onConfirm={confirmStatusChange}
				onCancel={closeConfirm}
			/>
		</div>
	);
}