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
import { categoriaProductoService, type CategoriaProducto } from "../services/CategoriaProductoService";
import "./CategoriasPage.css";

type CategoryFormState = {
	nombre: string;
};

const defaultFormState: CategoryFormState = {
	nombre: ""
};

export default function CategoriasPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [categories, setCategories] = useState<CategoriaProducto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
	const [form, setForm] = useState<CategoryFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<CategoriaProducto | null>(null);
	const [deleting, setDeleting] = useState(false);

	const loadCategories = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const data = await categoriaProductoService.listarPorEmpresa(empresaId);
			setCategories(data);
		} catch {
			setError("No se pudo cargar las categorías. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadCategories();
	}, [loadCategories]);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingCategoryId(null);
		setFormError(null);
	}, []);

	const openCreateModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingCategoryId(null);
		setFormError(null);
		setModalOpen(true);
	}, []);

	const openEditModal = useCallback((category: CategoriaProducto) => {
		setEditingCategoryId(category.id);
		setForm({ nombre: category.nombre });
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
			if (editingCategoryId) {
				const updated = await categoriaProductoService.actualizar(editingCategoryId, {
					nombre: form.nombre.trim()
				});
				setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			} else {
				const created = await categoriaProductoService.crear({
					empresaId,
					nombre: form.nombre.trim()
				});
				setCategories((prev) => [...prev, created]);
			}
			closeModal();
		} catch {
			setFormError("No se pudo guardar la categoría. Intenta nuevamente.");
		} finally {
			setSaving(false);
		}
	}, [closeModal, editingCategoryId, empresaId, form.nombre]);

	const openConfirmDelete = useCallback((category: CategoriaProducto) => {
		setConfirmTarget(category);
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
			await categoriaProductoService.eliminar(confirmTarget.id);
			setCategories((prev) => prev.filter((c) => c.id !== confirmTarget.id));
			closeConfirm();
		} catch {
			setError("No se pudo eliminar la categoría. Intenta nuevamente.");
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

	const filteredCategories = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return categories;
		return categories.filter((c) => c.nombre.toLowerCase().includes(q));
	}, [categories, searchQuery]);

	const columns: Array<DataTableColumn<CategoriaProducto>> = useMemo(
		() => [
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="cat__actions">
						<SecondaryButton type="button" className="cat__actionBtn" onClick={() => openEditModal(r)}>
							<Pencil size={14} strokeWidth={2} />
							<span>Editar</span>
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className="cat__actionBtn cat__actionBtn--danger"
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
		if (categories.length === 0) {
			return (
				<div className="cat__empty">
					<div className="cat__emptyTitle">No hay categorías registradas.</div>
					<div className="cat__emptySubtitle">
						Crea la primera categoría para organizar tus <span className="cat__emptyEmph">productos</span>.
					</div>
				</div>
			);
		}

		return (
			<div className="cat__empty">
				<div className="cat__emptyTitle">No se encontraron categorías.</div>
				<div className="cat__emptySubtitle">Prueba modificando la búsqueda.</div>
			</div>
		);
	}, [categories.length]);

	if (loading) {
		return (
			<div className="cat">
				<LoadingState label="Cargando categorías..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="cat">
				<div className="cat__state cat__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="cat">
			<PageHeader
				title="Categorías"
				subtitle="Administración de categorías de productos."
				actions={
					<PrimaryButton type="button" className="cat__newBtn" onClick={openCreateModal}>
						<Plus size={16} strokeWidth={2.2} />
						<span>Nueva Categoría</span>
					</PrimaryButton>
				}
			/>

			<div className="cat__controls">
				<div className="cat__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar categoría..." />
					</div>
				</div>
			</div>

			<div className="cat__table">
				<DataTable columns={columns} data={filteredCategories} emptyState={emptyState} />
			</div>

			<Modal
				open={modalOpen}
				title={editingCategoryId ? "Editar Categoría" : "Nueva Categoría"}
				onClose={closeModal}
				footer={
					<div className="cat__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={saving}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				<form className="cat__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cat__grid">
						<div className="cat__field cat__field--full">
							<label className="cat__label">Nombre</label>
							<input
								className="cat__input"
								type="text"
								placeholder="Ej: Bebidas"
								value={form.nombre}
								onChange={(e) => setForm({ nombre: e.target.value })}
							/>
						</div>

						{formError ? <div className="cat__field cat__field--full cat__formError">{formError}</div> : null}
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title="Eliminar categoría"
				message={`¿Deseas eliminar la categoría "${confirmTarget?.nombre ?? ""}"? Esta acción no se puede deshacer desde aquí.`}
				confirmText={deleting ? "Eliminando..." : "Eliminar"}
				cancelText="Cancelar"
				onConfirm={confirmDelete}
				onCancel={closeConfirm}
			/>
		</div>
	);
}