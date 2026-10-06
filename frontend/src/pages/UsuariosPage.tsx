import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, User, UserCheck, UserPlus, UserX } from "lucide-react";
import Avatar from "../components/Avatar";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { empresaService } from "../services/empresaService";
import { rolService, type Rol } from "../services/rolService";
import { usuarioService, type Usuario } from "../services/usuarioService";
import { useAccionRapida } from "../hooks/useAccionRapida";
import "./UsuariosPage.css";

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

function formatFecha(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	return Number.isNaN(d.getTime())
		? value
		: d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
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
	const [empresaNombre, setEmpresaNombre] = useState("");

	const [modalOpen, setModalOpen] = useState(false);
	const [editingUserId, setEditingUserId] = useState<number | null>(null);
	const [form, setForm] = useState<UserFormState>(defaultFormState);
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [searchText, setSearchText] = useState("");

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<{ id: number; nextActive: boolean } | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [usuariosData, rolesData, nombreEmpresa] = await Promise.all([
				usuarioService.listarPorEmpresa(empresaId, 0, 200),
				rolService.listarPorEmpresa(empresaId, 0, 200),
				empresaService
					.obtenerPorId(empresaId)
					.then((e) => e.nombre)
					.catch(() => "")
			]);
			setEmpresaNombre(nombreEmpresa);
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

	const openCreateModal = () => {
		setEditingUserId(null);
		setForm(defaultFormState);
		setFormError(null);
		setModalOpen(true);
	};

	useAccionRapida("nuevo", openCreateModal);

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
		if (!q) return users;
		return users.filter((u) => `${u.username} ${u.email}`.toLowerCase().includes(q));
	}, [searchText, users]);

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
			<header className="usr__header">
				<div className="usr__heading">
					<h1 className="usr__title">Usuarios y Roles</h1>
					<p className="usr__subtitle">Administra las credenciales y niveles de acceso del sistema.</p>
				</div>
				<div className="usr__tools">
					<div className="usr__search">
						<SearchBar placeholder="Buscar usuario..." value={searchText} onChange={setSearchText} />
					</div>
					<PrimaryButton type="button" onClick={openCreateModal}>
						<UserPlus size={16} strokeWidth={2.2} />
						<span>Añadir Nuevo</span>
					</PrimaryButton>
				</div>
			</header>

			{roles.length === 0 ? (
				<div className="usr__state">
					No hay roles creados para tu empresa todavía. Crea al menos un rol desde{" "}
					<code>POST /api/roles/crear</code> antes de asignar roles a los usuarios; puedes crear usuarios sin rol mientras tanto.
				</div>
			) : null}

			{filteredUsers.length === 0 ? (
				users.length === 0 ? (
					<div className="usr__empty">
						<div className="usr__emptyTitle">No hay usuarios registrados.</div>
						<div className="usr__emptySubtitle">Crea el primer usuario del sistema.</div>
					</div>
				) : (
					<div className="usr__empty">
						<div className="usr__emptyTitle">No se encontraron usuarios.</div>
						<div className="usr__emptySubtitle">Prueba modificando la búsqueda.</div>
					</div>
				)
			) : (
				<div className="usr__cards">
					{filteredUsers.map((u) => (
						<article key={u.id} className="usr__card">
							<div className="usr__cardTop">
								<Avatar
									name={u.username}
									size={84}
									className="usr__avatarImg"
									fallbackClassName="usr__avatarFallback"
								/>
								<StatusBadge status={u.active ? "Activo" : "Inactivo"} />
							</div>
							<div className="usr__identity">
								<div className="usr__name" title={u.username}>
									{u.username}
								</div>
								<div className="usr__role">
									{u.roles.length > 0 ? u.roles.map((rol) => rol.nombre).join(", ") : "Sin rol asignado"}
								</div>
							</div>
							<div className="usr__meta">
								<div className="usr__metaItem">
									<span className="usr__metaLabel">Negocio</span>
									<span className="usr__metaValue">{empresaNombre || "—"}</span>
								</div>
								<div className="usr__metaItem">
									<span className="usr__metaLabel">Actualizado</span>
									<span className="usr__metaValue">{formatFecha(u.updatedAt)}</span>
								</div>
							</div>
							<div className="usr__cardBottom">
								<div className="usr__contact" title={u.email}>
									{u.email}
								</div>
								<div className="usr__actions">
									<button type="button" className="usr__iconBtn" aria-label="Editar usuario" onClick={() => openEditModal(u)}>
										<Pencil size={15} strokeWidth={2} />
									</button>
									{u.id === currentUserId ? null : u.active ? (
										<button
											type="button"
											className="usr__iconBtn usr__iconBtn--danger"
											aria-label="Desactivar usuario"
											onClick={() => openConfirmStatusChange(u)}
										>
											<UserX size={15} strokeWidth={2} />
										</button>
									) : (
										<button
											type="button"
											className="usr__iconBtn"
											aria-label="Activar usuario"
											onClick={() => openConfirmStatusChange(u)}
										>
											<UserCheck size={15} strokeWidth={2} />
										</button>
									)}
								</div>
							</div>
						</article>
					))}
				</div>
			)}

			<Modal
				open={modalOpen}
				title={
					<div className="usr__modalHead">
						<div className="usr__modalTitle">
							<User size={20} strokeWidth={2} />
							<span>{editingUserId ? "Editar usuario" : "Crear nuevo usuario"}</span>
						</div>
						<p className="usr__modalSubtitle">
							{editingUserId
								? "Modifica los datos y los roles del usuario."
								: "Ingresa los datos del usuario para darle acceso al sistema."}
						</p>
					</div>
				}
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
					<div className="usr__grid">
						<div className="usr__field">
							<label className="usr__label">
								Usuario <span className="usr__req">*</span>
							</label>
							<input
								className="usr__input"
								type="text"
								placeholder="Nombre de usuario"
								value={form.username}
								onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))}
							/>
						</div>

						<div className="usr__field">
							<label className="usr__label">
								Correo <span className="usr__req">*</span>
							</label>
							<input
								className="usr__input"
								type="email"
								placeholder="correo@negocio.com"
								value={form.email}
								onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
							/>
						</div>

						<div className="usr__field usr__field--full">
							<label className="usr__label">
								{editingUserId ? (
									"Nueva contraseña (opcional)"
								) : (
									<>
										Contraseña <span className="usr__req">*</span>
									</>
								)}
							</label>
							<input
								className="usr__input"
								type="password"
								placeholder={editingUserId ? "Déjala en blanco para no cambiarla" : "Mínimo 6 caracteres"}
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

						{formError ? <div className="usr__field usr__field--full usr__formError">{formError}</div> : null}
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