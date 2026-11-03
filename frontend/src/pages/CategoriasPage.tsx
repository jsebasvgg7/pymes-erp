import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, Tag } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import CargaPagina from "../components/CargaPagina";
import ErrorState from "../components/ErrorState";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { productoService } from "../services/ProductoService";
import { ICONOS_CATEGORIA, ICONO_POR_DEFECTO, iconoParaCategoria, normalizarBusqueda } from "../utils/categoriaIcono";
import { categoriaProductoService, type CategoriaProducto } from "../services/CategoriaProductoService";
import { useAccionRapida } from "../hooks/useAccionRapida";
import "./CategoriasPage.css";

const POR_PAGINA = 20;

type CategoryFormState = {
	nombre: string;
	icono: string | null;
};

const defaultFormState: CategoryFormState = {
	nombre: "",
	icono: null
};

export default function CategoriasPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [categories, setCategories] = useState<CategoriaProducto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ErrorPagina | null>(null);

	const [conteos, setConteos] = useState<Map<number, number>>(new Map());
	const [visibles, setVisibles] = useState(POR_PAGINA);

	const [searchQuery, setSearchQuery] = useState("");

	const [modalOpen, setModalOpen] = useState(false);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
	const [form, setForm] = useState<CategoryFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<CategoriaProducto | null>(null);
	const [deleting, setDeleting] = useState(false);

	const [reactivatingId, setReactivatingId] = useState<number | null>(null);

	const loadCategories = useCallback(async () => {
		if (!empresaId) {
			setError(errorSesion("categorias"));
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [activas, inactivas] = await Promise.all([
				categoriaProductoService.listarPorEmpresa(empresaId),
				categoriaProductoService.listarInactivasPorEmpresa(empresaId)
			]);
			setCategories([...activas, ...inactivas]);
			try {
				const productos = await productoService.listarTodosPorEmpresa(empresaId);
				const mapa = new Map<number, number>();
				productos.forEach((p) => mapa.set(p.categoriaId, (mapa.get(p.categoriaId) ?? 0) + 1));
				setConteos(mapa);
			} catch {
				setConteos(new Map());
			}
		} catch (err) {
			setError(describirError("categorias", err));
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

	useAccionRapida("nuevo", openCreateModal);

	const openEditModal = useCallback((category: CategoriaProducto) => {
		setEditingCategoryId(category.id);
		setForm({ nombre: category.nombre, icono: category.icono });
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
					nombre: form.nombre.trim(),
					icono: form.icono
				});
				setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
			} else {
				const created = await categoriaProductoService.crear({
					empresaId,
					nombre: form.nombre.trim(),
					icono: form.icono
				});
				setCategories((prev) => [...prev, created]);
			}
			closeModal();
		} catch {
			setFormError("No se pudo guardar la categoría. Intenta nuevamente.");
		} finally {
			setSaving(false);
		}
	}, [closeModal, editingCategoryId, empresaId, form.icono, form.nombre]);

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

	const handleReactivate = useCallback(async (category: CategoriaProducto) => {
		setReactivatingId(category.id);
		try {
			const updated = await categoriaProductoService.reactivar(category.id);
			setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
		} catch {
			setError("No se pudo reactivar la categoría. Intenta nuevamente.");
		} finally {
			setReactivatingId(null);
		}
	}, []);

	const filteredCategories = useMemo(() => {
		const q = normalizarBusqueda(searchQuery.trim());
		if (!q) return categories;
		return categories.filter((c) => normalizarBusqueda(c.nombre).includes(q));
	}, [categories, searchQuery]);

	useEffect(() => {
		setVisibles(POR_PAGINA);
	}, [searchQuery]);

	const visibleCategories = useMemo(() => filteredCategories.slice(0, visibles), [filteredCategories, visibles]);

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
				<CargaPagina pagina="categorias" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="cat">
				<ErrorState pagina="categorias" error={error} onRetry={loadCategories} />
			</div>
		);
	}

	return (
		<div className="cat">
			<PageHeader
				title="Organización del catálogo"
				subtitle="Agrupa tus productos en categorías para encontrarlos y venderlos más rápido."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={14} strokeWidth={2.2} />
						<span>Nueva categoría</span>
					</PrimaryButton>
				}
			/>

			<div className="cat__controls">
				<div className="cat__search">
					<SearchBar
						placeholder="Buscar categoría..."
						value={searchQuery}
						onChange={setSearchQuery}
					/>
				</div>
			</div>

			{filteredCategories.length === 0 && categories.length > 0 ? emptyState : null}

			<div className="cat__grid-cards">
				{visibleCategories.map((c) => {
					const Icono = iconoParaCategoria(c.nombre, c.icono);
					const total = conteos.get(c.id) ?? 0;
					return (
						<article key={c.id} className={`cat__card${c.active ? "" : " cat__card--inactiva"}`}>
							<div className="cat__cardTop">
								<span className="cat__avatar">
									<Icono size={20} strokeWidth={1.8} />
								</span>
								<div className="cat__cardActions">
									{c.active ? (
										<>
											<button type="button" className="cat__iconBtn" aria-label={`Editar ${c.nombre}`} title="Editar" onClick={() => openEditModal(c)}>
												<Pencil size={16} strokeWidth={1.8} />
											</button>
											<button type="button" className="cat__iconBtn cat__iconBtn--danger" aria-label={`Eliminar ${c.nombre}`} title="Eliminar" onClick={() => openConfirmDelete(c)}>
												<Trash2 size={16} strokeWidth={1.8} />
											</button>
										</>
									) : (
										<button
											type="button"
											className="cat__iconBtn"
											aria-label={`Reactivar ${c.nombre}`}
											title={reactivatingId === c.id ? "Reactivando..." : "Reactivar"}
											onClick={() => handleReactivate(c)}
											disabled={reactivatingId === c.id}
										>
											<RotateCcw size={16} strokeWidth={1.8} />
										</button>
									)}
								</div>
							</div>
							<div className="cat__cardBottom">
								<div className="cat__cardName">{c.nombre}</div>
								<div className="cat__cardMeta">
									<span>{total} {total === 1 ? "producto" : "productos"}</span>
									{c.active ? null : <StatusBadge status="Inactivo" />}
								</div>
							</div>
						</article>
					);
				})}

				{!searchQuery.trim() ? (
					<button type="button" className="cat__card cat__card--nueva" onClick={openCreateModal}>
						<Plus size={20} strokeWidth={1.8} />
						<span>Nueva categoría</span>
					</button>
				) : null}
			</div>

			{visibleCategories.length < filteredCategories.length ? (
				<div className="cat__more">
					<SecondaryButton type="button" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
						Ver más
					</SecondaryButton>
				</div>
			) : null}

			<Modal
				open={modalOpen}
				title={editingCategoryId ? "Editar categoría" : "Nueva categoría"}
				subtitle={editingCategoryId ? "Modifica el nombre de la categoría." : "Crea una categoría para organizar tus productos."}
				icon={<Tag size={20} strokeWidth={2} />}
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
								onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
							/>
						</div>

						<div className="cat__field cat__field--full">
							<span className="cat__label" id="cat-icono-label">Icono</span>
							<div className="cat__iconGrid" role="radiogroup" aria-labelledby="cat-icono-label">
								{ICONOS_CATEGORIA.map((o) => {
									const Icono = o.icono;
									const activo = (form.icono ?? ICONO_POR_DEFECTO) === o.clave;
									return (
										<button
											key={o.clave}
											type="button"
											role="radio"
											aria-checked={activo}
											aria-label={o.etiqueta}
											title={o.etiqueta}
											className={`cat__iconOpt${activo ? " cat__iconOpt--activo" : ""}`}
											onClick={() => setForm((f) => ({ ...f, icono: o.clave }))}
										>
											<Icono size={20} strokeWidth={1.8} />
										</button>
									);
								})}
							</div>
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