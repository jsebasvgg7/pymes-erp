import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { clienteService, type Cliente } from "../services/clienteService";
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
	const searchRef = useRef<HTMLDivElement | null>(null);

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
		if (!form.nombre.trim()) {
			setFormError("El nombre es obligatorio.");
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

	useEffect(() => {
		const el = searchRef.current;
		if (!el) return;

		const input = el.querySelector("input");
		if (!input) return;

		const onInput = (e: Event) => {
			const target = e.target as HTMLInputElement | null;
			setSearchQuery(target?.value ?? "");
		};

		input.addEventListener("input", onInput);
		return () => {
			input.removeEventListener("input", onInput);
		};
	}, []);

	const filteredClientes = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return clientes;
		return clientes.filter(
			(c) =>
				c.nombre.toLowerCase().includes(q) ||
				(c.documento ?? "").toLowerCase().includes(q) ||
				(c.email ?? "").toLowerCase().includes(q)
		);
	}, [clientes, searchQuery]);

	const columns: Array<DataTableColumn<Cliente>> = useMemo(
		() => [
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "documento", header: "Documento", render: (r) => r.documento || "—" },
			{ key: "telefono", header: "Teléfono", render: (r) => r.telefono || "—" },
			{ key: "email", header: "Correo", render: (r) => r.email || "—" },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="cli__actions">
						<SecondaryButton type="button" className="cli__actionBtn" onClick={() => openEditModal(r)}>
							<Pencil size={14} strokeWidth={2} />
							<span>Editar</span>
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className="cli__actionBtn cli__actionBtn--danger"
							onClick={() => openConfirmDelete(r)}
						>
							<Trash2 size={14} strokeWidth={2} />
							<span>Eliminar</span>
						</SecondaryButton>
					</div>
				)
			}
		],
		[openConfirmDelete, openEditModal]
	);

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
				title="Clientes"
				subtitle="Administración de clientes registrados."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={16} strokeWidth={2.2} />
						<span>Nuevo Cliente</span>
					</PrimaryButton>
				}
			/>

			<div className="cli__controls">
				<div className="cli__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar cliente..." />
					</div>
				</div>
			</div>

			<div className="cli__table">
				<DataTable columns={columns} data={filteredClientes} emptyState={emptyState} />
			</div>

			<Modal
				open={modalOpen}
				title={editingClienteId ? "Editar Cliente" : "Nuevo Cliente"}
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
							<label className="cli__label">Nombre</label>
							<input
								className="cli__input"
								type="text"
								placeholder="Nombre del cliente"
								value={form.nombre}
								onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">Documento</label>
							<input
								className="cli__input"
								type="text"
								placeholder="NIT / Cédula"
								value={form.documento}
								onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">Teléfono</label>
							<input
								className="cli__input"
								type="text"
								placeholder="+57 ..."
								value={form.telefono}
								onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
							/>
						</div>
						<div className="cli__field">
							<label className="cli__label">Correo</label>
							<input
								className="cli__input"
								type="email"
								placeholder="correo@cliente.com"
								value={form.email}
								onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
							/>
						</div>
						<div className="cli__field cli__field--full">
							<label className="cli__label">Dirección</label>
							<input
								className="cli__input"
								type="text"
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