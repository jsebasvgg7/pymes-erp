import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, User, UserPlus } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SummaryPanel from "../components/SummaryPanel";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { clienteService, type Cliente } from "../services/clienteService";
import { useAccionRapida } from "../hooks/useAccionRapida";
import "./ClientesPage.css";

type ClienteFormState = {
	nombre: string;
	documento: string;
	telefono: string;
	email: string;
	direccion: string;
};

const defaultFormState: ClienteFormState = {
	nombre: "",
	documento: "",
	telefono: "",
	email: "",
	direccion: ""
};

export default function ClientesPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");

	const [modalOpen, setModalOpen] = useState(false);
	const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
	const [form, setForm] = useState<ClienteFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<Cliente | null>(null);
	const [deleting, setDeleting] = useState(false);

	const loadClientes = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const data = await clienteService.listarPorEmpresa(empresaId, 0, 200);
			setClientes(data.content);
		} catch {
			setError("No se pudo cargar los clientes. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadClientes();
	}, [loadClientes]);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingClienteId(null);
		setFormError(null);
	}, []);

	const openCreateModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingClienteId(null);
		setFormError(null);
		setModalOpen(true);
	}, []);

	useAccionRapida("nuevo", openCreateModal);

	const openEditModal = useCallback((cliente: Cliente) => {
		setEditingClienteId(cliente.id);
		setForm({
			nombre: cliente.nombre,
			documento: cliente.documento ?? "",
			telefono: cliente.telefono ?? "",
			email: cliente.email ?? "",
			direccion: cliente.direccion ?? ""
		});
		setFormError(null);
		setModalOpen(true);
	}, []);

	const handleSave = useCallback(async () => {
		if (!form.nombre.trim() || !form.documento.trim() || !form.telefono.trim() || !form.email.trim()) {
			setFormError("Completa los campos obligatorios (*).");
			return;
		}

		if (!empresaId) {
			setFormError("No se encontró la empresa del usuario.");
			return;
		}

		setSaving(true);
		setFormError(null);
		try {
			const payload = {
				nombre: form.nombre.trim(),
				documento: form.documento.trim() || undefined,
				telefono: form.telefono.trim() || undefined,
				email: form.email.trim() || undefined,
				direccion: form.direccion.trim() || undefined
			};

			if (editingClienteId) {
				const updated = await clienteService.actualizar(editingClienteId, payload);
				setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			} else {
				const created = await clienteService.crear({ empresaId, ...payload });
				setClientes((prev) => [...prev, created]);
			}
			closeModal();
		} catch {
			setFormError("No se pudo guardar el cliente. Intenta nuevamente.");
		} finally {
			setSaving(false);
		}
	}, [closeModal, editingClienteId, empresaId, form]);

	const openConfirmDelete = useCallback((cliente: Cliente) => {
		setConfirmTarget(cliente);
		setConfirmOpen(true);
	}, []);

	const closeConfirm = useCallback(() => {
		setConfirmOpen(false);
		setConfirmTarget(null);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!confirmTarget) return;

		setDeleting(true);
		try {
			await clienteService.eliminar(confirmTarget.id);
			setClientes((prev) => prev.filter((c) => c.id !== confirmTarget.id));
			closeConfirm();
		} catch {
			setError("No se pudo eliminar el cliente. Intenta nuevamente.");
			closeConfirm();
		} finally {
			setDeleting(false);
		}
	}, [closeConfirm, confirmTarget]);

	const filteredClientes = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return clientes;
		return clientes.filter((c) => c.nombre.toLowerCase().includes(q));
	}, [clientes, searchQuery]);

	const formatFecha = useCallback(
		(iso: string) =>
			new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
		[]
	);

	const resumen = useMemo(() => {
		const activos = clientes.filter((c) => c.active).length;
		const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const nuevos = clientes.filter((c) => new Date(c.createdAt).getTime() >= limite).length;
		const recientes = [...clientes]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id)
			.slice(0, 6);
		return { activos, inactivos: clientes.length - activos, nuevos, recientes };
	}, [clientes]);

	const emptyState = useMemo(() => {
		if (clientes.length === 0) {
			return (
				<div className="cli__empty">
					<div className="cli__emptyTitle">No hay clientes registrados.</div>
					<div className="cli__emptySubtitle">Crea el primer cliente para empezar a facturar.</div>
				</div>
			);
		}

		return (
			<div className="cli__empty">
				<div className="cli__emptyTitle">No se encontraron clientes.</div>
				<div className="cli__emptySubtitle">Prueba modificando la búsqueda.</div>
			</div>
		);
	}, [clientes.length]);

	if (loading) {
		return (
			<div className="cli">
				<LoadingState label="Cargando clientes..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="cli">
				<div className="cli__state cli__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="cli">
			<PageHeader
				title="Directorio de clientes"
				subtitle="Consulta y administra los contactos de tus clientes."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<UserPlus size={14} strokeWidth={2.2} />
						<span>Nuevo cliente</span>
					</PrimaryButton>
				}
			/>

			<div className="cli__search">
				<SearchBar placeholder="Buscar por nombre..." value={searchQuery} onChange={setSearchQuery} />
			</div>

			<div className="cli__layout">
				<div className="cli__main">
					{filteredClientes.length === 0 ? (
						emptyState
					) : (
						<div className="cli__grid-cards">
							{filteredClientes.map((c) => (
								<article key={c.id} className="cli__card">
									<div className="cli__cardTop">
										<span className="cli__avatar" aria-hidden="true">
											<User size={22} strokeWidth={1.8} />
										</span>
										<StatusBadge status={c.active ? "Activo" : "Inactivo"} />
									</div>
									<div className="cli__identity">
										<div className="cli__name" title={c.nombre}>
											{c.nombre}
										</div>
										<div className="cli__role">Cliente</div>
									</div>
									<div className="cli__meta">
										<div className="cli__metaItem">
											<span className="cli__metaLabel">Documento</span>
											<span className="cli__metaValue">{c.documento || "—"}</span>
										</div>
										<div className="cli__metaItem">
											<span className="cli__metaLabel">Creado</span>
											<span className="cli__metaValue">{formatFecha(c.createdAt)}</span>
										</div>
									</div>
									<div className="cli__cardBottom">
										<div className="cli__contact">
											<span title={c.email}>{c.email || "—"}</span>
											<span>{c.telefono || "—"}</span>
										</div>
										<div className="cli__actions">
											<button type="button" className="cli__iconBtn" aria-label="Editar cliente" onClick={() => openEditModal(c)}>
												<Pencil size={15} strokeWidth={2} />
											</button>
											<button
												type="button"
												className="cli__iconBtn cli__iconBtn--danger"
												aria-label="Eliminar cliente"
												onClick={() => openConfirmDelete(c)}
											>
												<Trash2 size={15} strokeWidth={2} />
											</button>
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</div>

				{clientes.length > 0 ? (
					<SummaryPanel
						title="Resumen de clientes"
						subtitle="Un vistazo rápido a tu directorio."
						stats={[
							{ label: "Total", value: clientes.length },
							{ label: "Activos", value: resumen.activos },
							{ label: "Inactivos", value: resumen.inactivos },
							{ label: "Nuevos en 30 días", value: resumen.nuevos }
						]}
						sections={[
							{
								title: "Agregados recientemente",
								emptyText: "Aún no hay clientes registrados.",
								items: resumen.recientes.map((c) => ({
									key: c.id,
									primary: c.nombre,
									secondary: c.documento || "Sin documento",
									value: formatFecha(c.createdAt),
									onClick: () => openEditModal(c)
								}))
							}
						]}
					/>
				) : null}
			</div>

			<Modal
				open={modalOpen}
				title={editingClienteId ? "Editar cliente" : "Crear nuevo cliente"}
				subtitle={
					editingClienteId
						? "Modifica los datos del cliente."
						: "Ingresa los datos del cliente para agregarlo al directorio."
				}
				icon={<User size={20} strokeWidth={2} />}
				onClose={closeModal}
				footer={
					<div className="cli__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="cli__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cli__grid">
						<div className="cli__field">
							<label className="cli__label">
								Nombre <span className="cli__req">*</span>
							</label>
							<input
								className="cli__input"
								type="text"
								placeholder="Nombre del cliente"
								value={form.nombre}
								onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">
								Documento <span className="cli__req">*</span>
							</label>
							<input
								className="cli__input"
								type="text"
								placeholder="NIT / Cédula"
								value={form.documento}
								onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">
								Teléfono <span className="cli__req">*</span>
							</label>
							<input
								className="cli__input"
								type="text"
								placeholder="+57 ..."
								value={form.telefono}
								onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">
								Correo <span className="cli__req">*</span>
							</label>
							<input
								className="cli__input"
								type="email"
								placeholder="correo@cliente.com"
								value={form.email}
								onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
							/>
						</div>
						<div className="cli__field cli__field--full">
							<label className="cli__label">Dirección (opcional)</label>
							<textarea
								className="cli__input cli__textarea"
								placeholder="Dirección"
								value={form.direccion}
								onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
							/>
						</div>

						{formError ? <div className="cli__field cli__field--full cli__formError">{formError}</div> : null}
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title="Eliminar cliente"
				message={`¿Deseas eliminar el cliente "${confirmTarget?.nombre ?? ""}"? Esta acción no se puede deshacer desde aquí.`}
				confirmText={deleting ? "Eliminando..." : "Eliminar"}
				cancelText="Cancelar"
				onConfirm={confirmDelete}
				onCancel={closeConfirm}
			/>
		</div>
	);
}