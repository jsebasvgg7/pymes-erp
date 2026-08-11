import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { addCategory, getCategories, updateCategory, type Category, type CategoryStatus } from "../services/categoryStorage";
import "./CategoriasPage.css";

type CategoryFormState = {
	nombre: string;
	descripcion: string;
	estado: CategoryStatus;
};

const defaultFormState: CategoryFormState = {
	nombre: "",
	descripcion: "",
	estado: "Activo"
};

export default function CategoriasPage() {
	const [categories, setCategories] = useState<Category[]>(() => getCategories());
	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
	const [form, setForm] = useState<CategoryFormState>(defaultFormState);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<{ id: string; nextStatus: CategoryStatus } | null>(null);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingCategoryId(null);
	}, []);

	const openCreateModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingCategoryId(null);
		setModalOpen(true);
	}, []);

	const openEditModal = useCallback((category: Category) => {
		setEditingCategoryId(category.id);
		setForm({
			nombre: category.nombre,
			descripcion: category.descripcion ?? "",
			estado: category.estado
		});
		setModalOpen(true);
	}, []);

	const handleSave = useCallback(() => {
		if (editingCategoryId) {
			const updated = updateCategory(editingCategoryId, {
				nombre: form.nombre,
				descripcion: form.descripcion,
				estado: form.estado
			});

			if (updated) {
				setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			}

			closeModal();
			return;
		}

		const created = addCategory({
			nombre: form.nombre,
			descripcion: form.descripcion,
			estado: form.estado
		});

		setCategories((prev) => [...prev, created]);
		closeModal();
	}, [closeModal, editingCategoryId, form.descripcion, form.estado, form.nombre]);

	const openConfirmStatusChange = useCallback((category: Category) => {
		setConfirmTarget({
			id: category.id,
			nextStatus: category.estado === "Activo" ? "Inactivo" : "Activo"
		});
		setConfirmOpen(true);
	}, []);

	const closeConfirm = useCallback(() => {
		setConfirmOpen(false);
		setConfirmTarget(null);
	}, []);

	const confirmStatusChange = useCallback(() => {
		if (!confirmTarget) return;

		const updated = updateCategory(confirmTarget.id, { estado: confirmTarget.nextStatus });
		if (updated) {
			setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
		}

		closeConfirm();
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

	const columns: Array<DataTableColumn<Category>> = useMemo(
		() => [
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "descripcion", header: "Descripción", render: (r) => r.descripcion ?? "" },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.estado} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="cat__actions">
						<SecondaryButton type="button" className="cat__actionBtn" onClick={() => openEditModal(r)}>
							Editar
						</SecondaryButton>
						{r.estado === "Activo" ? (
							<SecondaryButton
								type="button"
								className="cat__actionBtn cat__actionBtn--danger"
								onClick={() => openConfirmStatusChange(r)}
							>
								Desactivar
							</SecondaryButton>
						) : (
							<SecondaryButton type="button" className="cat__actionBtn" onClick={() => openConfirmStatusChange(r)}>
								Activar
							</SecondaryButton>
						)}
					</div>
				)
			}
		],
		[openConfirmStatusChange, openEditModal]
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

	return (
		<div className="cat">
			<PageHeader
				title="Categorías"
				subtitle="Administración de categorías de productos."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						+ Nueva Categoría
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
						<SecondaryButton type="button" onClick={closeModal}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave}>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				<form className="cat__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cat__grid">
						<div className="cat__field">
							<label className="cat__label">Nombre</label>
							<input
								className="cat__input"
								type="text"
								placeholder="Ej: Bebidas"
								value={form.nombre}
								onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
							/>
						</div>

						<div className="cat__field">
							<label className="cat__label">Estado</label>
							<select
								className="cat__select"
								value={form.estado}
								onChange={(e) => setForm((v) => ({ ...v, estado: e.target.value as CategoryStatus }))}
							>
								<option value="Activo">Activo</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>

						<div className="cat__field cat__field--full">
							<label className="cat__label">Descripción (opcional)</label>
							<textarea
								className="cat__textarea"
								rows={3}
								placeholder="Descripción de la categoría..."
								value={form.descripcion}
								onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
							/>
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar categoría" : "Activar categoría"}
				message={
					confirmTarget?.nextStatus === "Inactivo"
						? "¿Deseas desactivar esta categoría?"
						: "¿Deseas volver a activar esta categoría?"
				}
				confirmText={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar" : "Activar"}
				cancelText="Cancelar"
				onConfirm={confirmStatusChange}
				onCancel={closeConfirm}
			/>
		</div>
	);
}

