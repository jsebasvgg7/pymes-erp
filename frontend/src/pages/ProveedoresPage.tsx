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
import { proveedorService, type Proveedor } from "../services/proveedorService";
import "./ProveedoresPage.css";

type ProveedorFormState = {
	nombre: string;
	documento: string;
	telefono: string;
	email: string;
	direccion: string;
};

const defaultFormState: ProveedorFormState = {
	nombre: "",
	documento: "",
	telefono: "",
	email: "",
	direccion: ""
};

export default function ProveedoresPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);
	const [form, setForm] = useState<ProveedorFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<Proveedor | null>(null);
	const [deleting, setDeleting] = useState(false);

	const loadProveedores = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const data = await proveedorService.listarPorEmpresa(empresaId);
			setProveedores(data);
		} catch {
			setError("No se pudo cargar los proveedores. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadProveedores();
	}, [loadProveedores]);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingProveedorId(null);
		setFormError(null);
	}, []);

	const openCreateModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingProveedorId(null);
		setFormError(null);
		setModalOpen(true);
	}, []);

	const openEditModal = useCallback((proveedor: Proveedor) => {
		setEditingProveedorId(proveedor.id);
		setForm({
			nombre: proveedor.nombre,
			documento: proveedor.documento ?? "",
			telefono: proveedor.telefono ?? "",
			email: proveedor.email ?? "",
			direccion: proveedor.direccion ?? ""
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

			if (editingProveedorId) {
				const updated = await proveedorService.actualizar(editingProveedorId, payload);
				setProveedores((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
			} else {
				const created = await proveedorService.crear({ empresaId, ...payload });
				setProveedores((prev) => [...prev, created]);
			}
			closeModal();
		} catch {
			setFormError("No se pudo guardar el proveedor. Intenta nuevamente.");
		} finally {
			setSaving(false);
		}
	}, [closeModal, editingProveedorId, empresaId, form]);

	const openConfirmDelete = useCallback((proveedor: Proveedor) => {
		setConfirmTarget(proveedor);
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
			await proveedorService.eliminar(confirmTarget.id);
			setProveedores((prev) => prev.filter((p) => p.id !== confirmTarget.id));
			closeConfirm();
		} catch {
			setError("No se pudo eliminar el proveedor. Intenta nuevamente.");
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

	const filteredProveedores = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return proveedores;
		return proveedores.filter(
			(p) =>
				p.nombre.toLowerCase().includes(q) ||
				(p.documento ?? "").toLowerCase().includes(q) ||
				(p.email ?? "").toLowerCase().includes(q)
		);
	}, [proveedores, searchQuery]);

	const columns: Array<DataTableColumn<Proveedor>> = useMemo(
		() => [
			{ key: "nombre", header: "Empresa", render: (r) => r.nombre },
			{ key: "documento", header: "NIT", render: (r) => r.documento || "—" },
			{ key: "telefono", header: "Teléfono", render: (r) => r.telefono || "—" },
			{ key: "email", header: "Correo", render: (r) => r.email || "—" },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="prov__actions">
						<SecondaryButton type="button" className="prov__actionBtn" onClick={() => openEditModal(r)}>
							<Pencil size={14} strokeWidth={2} />
							<span>Editar</span>
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className="prov__actionBtn prov__actionBtn--danger"
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
		if (proveedores.length === 0) {
			return (
				<div className="prov__empty">
					<div className="prov__emptyTitle">No hay proveedores registrados.</div>
					<div className="prov__emptySubtitle">Crea el primer proveedor para gestionar tus compras.</div>
				</div>
			);
		}

		return (
			<div className="prov__empty">
				<div className="prov__emptyTitle">No se encontraron proveedores.</div>
				<div className="prov__emptySubtitle">Prueba modificando la búsqueda.</div>
			</div>
		);
	}, [proveedores.length]);

	if (loading) {
		return (
			<div className="prov">
				<LoadingState label="Cargando proveedores..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="prov">
				<div className="prov__state prov__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="prov">
			<PageHeader
				title="Proveedores"
				subtitle="Administración de proveedores registrados."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={16} strokeWidth={2.2} />
						<span>Nuevo Proveedor</span>
					</PrimaryButton>
				}
			/>

			<div className="prov__controls">
				<div className="prov__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar proveedor..." />
					</div>
				</div>
			</div>

			<div className="prov__table">
				<DataTable columns={columns} data={filteredProveedores} emptyState={emptyState} />
			</div>

			<Modal
				open={modalOpen}
				title={editingProveedorId ? "Editar Proveedor" : "Nuevo Proveedor"}
				onClose={closeModal}
				footer={
					<div className="prov__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="prov__form" onSubmit={(e) => e.preventDefault()}>
					<div className="prov__grid">
						<div className="prov__field">
							<label className="prov__label">Empresa</label>
							<input
								className="prov__input"
								type="text"
								placeholder="Nombre de la empresa"
								value={form.nombre}
								onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">NIT</label>
							<input
								className="prov__input"
								type="text"
								placeholder="NIT"
								value={form.documento}
								onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Teléfono</label>
							<input
								className="prov__input"
								type="text"
								placeholder="+57 ..."
								value={form.telefono}
								onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Correo</label>
							<input
								className="prov__input"
								type="email"
								placeholder="correo@proveedor.com"
								value={form.email}
								onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
							/>
						</div>
						<div className="prov__field prov__field--full">
							<label className="prov__label">Dirección</label>
							<input
								className="prov__input"
								type="text"
								placeholder="Dirección"
								value={form.direccion}
								onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
							/>
						</div>

						{formError ? <div className="prov__field prov__field--full prov__formError">{formError}</div> : null}
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title="Eliminar proveedor"
				message={`¿Deseas eliminar el proveedor "${confirmTarget?.nombre ?? ""}"? Esta acción no se puede deshacer desde aquí.`}
				confirmText={deleting ? "Eliminando..." : "Eliminar"}
				cancelText="Cancelar"
				onConfirm={confirmDelete}
				onCancel={closeConfirm}
			/>
		</div>
	);
}