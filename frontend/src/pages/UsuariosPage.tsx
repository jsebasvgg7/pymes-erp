import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { addUser, getUsers, updateUser, type User, type UserRole, type UserStatus } from "../services/userStorage";
import "./UsuariosPage.css";

type UserFilter = "Todos" | "Activos" | "Inactivos";

type UserFormState = {
	fotoUrl: string;
	nombre: string;
	correo: string;
	usuario: string;
	rol: UserRole | "";
	estado: UserStatus;
};

const defaultFormState: UserFormState = {
	fotoUrl: "",
	nombre: "",
	correo: "",
	usuario: "",
	rol: "",
	estado: "Activo"
};

function formatDateTime(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function normalizeText(value: string) {
	return value.trim().toLowerCase();
}

export default function UsuariosPage() {
	const [users, setUsers] = useState<User[]>(() => getUsers());
	const [modalOpen, setModalOpen] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [form, setForm] = useState<UserFormState>(defaultFormState);
	const [selectedFilter, setSelectedFilter] = useState<UserFilter>("Todos");
	const [searchText, setSearchText] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<{ id: string; nextStatus: UserStatus } | null>(null);

	const searchRef = useRef<HTMLDivElement | null>(null);

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
		setModalOpen(true);
	};

	const openEditModal = useCallback((user: User) => {
		setEditingUserId(user.id);
		setForm({
			fotoUrl: user.fotoUrl ?? "",
			nombre: user.nombre,
			correo: user.correo,
			usuario: user.usuario,
			rol: user.rol,
			estado: user.estado
		});
		setModalOpen(true);
	}, []);

	const closeModal = () => {
		setModalOpen(false);
	};

	const isFormValid = useMemo(() => {
		const nombreOk = form.nombre.trim().length > 0;
		const correoOk = form.correo.trim().length > 0;
		const usuarioOk = form.usuario.trim().length > 0;
		const rolOk = form.rol !== "";
		return nombreOk && correoOk && usuarioOk && rolOk;
	}, [form.correo, form.nombre, form.rol, form.usuario]);

	const handleSave = () => {
		if (!isFormValid) return;

		if (!editingUserId) {
			const created = addUser({
				fotoUrl: form.fotoUrl,
				nombre: form.nombre.trim(),
				correo: form.correo.trim(),
				usuario: form.usuario.trim(),
				rol: form.rol as UserRole,
				estado: form.estado
			});
			setUsers((prev) => [...prev, created]);
			closeModal();
			return;
		}

		const updated = updateUser(editingUserId, {
			fotoUrl: form.fotoUrl,
			nombre: form.nombre.trim(),
			correo: form.correo.trim(),
			usuario: form.usuario.trim(),
			rol: form.rol as UserRole,
			estado: form.estado
		});

		if (updated) {
			setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
		}
		closeModal();
	};

	const openConfirmStatusChange = useCallback((user: User) => {
		const nextStatus: UserStatus = user.estado === "Activo" ? "Inactivo" : "Activo";
		setConfirmTarget({ id: user.id, nextStatus });
		setConfirmOpen(true);
	}, []);

	const closeConfirm = () => {
		setConfirmOpen(false);
		setConfirmTarget(null);
	};

	const confirmStatusChange = () => {
		if (!confirmTarget) return;
		const updated = updateUser(confirmTarget.id, { estado: confirmTarget.nextStatus });
		if (updated) {
			setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
		}
		closeConfirm();
	};

	const filteredUsers = useMemo(() => {
		const q = normalizeText(searchText);
		return users.filter((u) => {
			const matchesFilter =
				selectedFilter === "Todos" ||
				(selectedFilter === "Activos" && u.estado === "Activo") ||
				(selectedFilter === "Inactivos" && u.estado === "Inactivo");

			if (!matchesFilter) return false;
			if (!q) return true;

			const haystack = `${u.nombre} ${u.usuario} ${u.correo}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [searchText, selectedFilter, users]);

	const columns: Array<DataTableColumn<User>> = useMemo(
		() => [
			{
				key: "foto",
				header: "Foto",
				render: (r) => (
					<div className="usr__avatarCell" aria-hidden="true">
						{r.fotoUrl ? <img className="usr__avatarImg" src={r.fotoUrl} alt="" /> : r.nombre.trim().slice(0, 1).toUpperCase()}
					</div>
				)
			},
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "usuario", header: "Usuario", render: (r) => r.usuario },
			{ key: "correo", header: "Correo", render: (r) => r.correo },
			{ key: "rol", header: "Rol", render: (r) => r.rol },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.estado} /> },
			{ key: "ultimoAcceso", header: "Último acceso", render: (r) => formatDateTime(r.ultimoAcceso) },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="usr__actions">
						<SecondaryButton type="button" className="usr__actionBtn" onClick={() => openEditModal(r)}>
							Editar
						</SecondaryButton>
						{r.estado === "Activo" ? (
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
		[openConfirmStatusChange, openEditModal]
	);

	return (
		<div className="usr">
			<PageHeader
				title="Usuarios"
				subtitle="Administra los usuarios que podrán acceder al sistema."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						+ Nuevo Usuario
					</PrimaryButton>
				}
			/>

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
						<SecondaryButton type="button" onClick={closeModal}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!isFormValid}>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				<form className="usr__form" onSubmit={(e) => e.preventDefault()}>
					<div className="usr__grid">
						<div className="usr__field usr__field--full">
							<label className="usr__label">Foto (URL opcional)</label>
							<input
								className="usr__input"
								type="text"
								placeholder="https://..."
								value={form.fotoUrl}
								onChange={(e) => setForm((v) => ({ ...v, fotoUrl: e.target.value }))}
							/>
						</div>

						<div className="usr__field usr__field--full">
							<label className="usr__label">Nombre completo *</label>
							<input
								className="usr__input"
								type="text"
								value={form.nombre}
								onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
							/>
						</div>

						<div className="usr__field">
							<label className="usr__label">Correo electrónico *</label>
							<input
								className="usr__input"
								type="email"
								value={form.correo}
								onChange={(e) => setForm((v) => ({ ...v, correo: e.target.value }))}
							/>
						</div>

						<div className="usr__field">
							<label className="usr__label">Nombre de usuario *</label>
							<input
								className="usr__input"
								type="text"
								value={form.usuario}
								onChange={(e) => setForm((v) => ({ ...v, usuario: e.target.value }))}
							/>
						</div>

						<div className="usr__field">
							<label className="usr__label">Rol *</label>
							<select
								className="usr__select"
								value={form.rol}
								onChange={(e) => setForm((v) => ({ ...v, rol: e.target.value as UserRole }))}
							>
								<option value="" disabled>
									Seleccionar...
								</option>
								<option value="Administrador">Administrador</option>
								<option value="Supervisor">Supervisor</option>
								<option value="Cajero">Cajero</option>
								<option value="Bodega">Bodega</option>
							</select>
						</div>

						<div className="usr__field">
							<label className="usr__label">Estado</label>
							<select
								className="usr__select"
								value={form.estado}
								onChange={(e) => setForm((v) => ({ ...v, estado: e.target.value as UserStatus }))}
							>
								<option value="Activo">Activo</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar usuario" : "Activar usuario"}
				message={
					confirmTarget?.nextStatus === "Inactivo"
						? "¿Deseas desactivar este usuario?"
						: "¿Deseas volver a activar este usuario?"
				}
				confirmText={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar" : "Activar"}
				cancelText="Cancelar"
				onConfirm={confirmStatusChange}
				onCancel={closeConfirm}
			/>
		</div>
	);
}

