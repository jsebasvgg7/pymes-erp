import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { productoService, type Producto, type ProductoCreateRequest, type ProductoUpdateRequest } from "../services/ProductoService";
import "./ProductosPage.css";

const UNIDADES_MEDIDA = ["UNIDAD", "KILOGRAMO", "GRAMO", "LITRO", "MILILITRO", "CAJA", "PAQUETE"] as const;

type ProductFormState = {
	nombre: string;
	sku: string;
	categoriaId: string;
	unidadMedida: string;
	costo: string;
	precioVenta: string;
	stockMinimo: string;
	stockInicial: string;
	descripcion: string;
};

const defaultFormState: ProductFormState = {
	nombre: "",
	sku: "",
	categoriaId: "",
	unidadMedida: "UNIDAD",
	costo: "",
	precioVenta: "",
	stockMinimo: "",
	stockInicial: "",
	descripcion: ""
};

function parseDecimalInput(value: string) {
	const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function ProductosPage() {
	const navigate = useNavigate();
	const empresaId = authService.getUsuario()?.empresaId;

	const [products, setProducts] = useState<Producto[]>([]);
	const [categories, setCategories] = useState<CategoriaProducto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
	const [form, setForm] = useState<ProductFormState>(defaultFormState);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<Producto | null>(null);
	const [deleting, setDeleting] = useState(false);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const [productosRes, categoriasRes] = await Promise.all([
				productoService.listarPorEmpresa(empresaId, 0, 200),
				categoriaProductoService.listarPorEmpresa(empresaId)
			]);
			setProducts(productosRes.content);
			setCategories(categoriasRes);
		} catch {
			setError("No se pudo cargar los productos. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories]);
	const hasActiveCategories = activeCategories.length > 0;

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingProduct(null);
		setFormError(null);
	}, []);

	const openCreateModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingProduct(null);
		setFormError(null);
		setModalOpen(true);
	}, []);

	const openEditModal = useCallback((product: Producto) => {
		setEditingProduct(product);
		setForm({
			nombre: product.nombre,
			sku: product.sku ?? "",
			categoriaId: product.categoriaId ? String(product.categoriaId) : "",
			unidadMedida: product.unidadMedida ?? "UNIDAD",
			costo: String(product.costo ?? 0),
			precioVenta: String(product.precioVenta ?? 0),
			stockMinimo: String(product.stockMinimo ?? 0),
			stockInicial: String(product.stockActual ?? 0),
			descripcion: product.descripcion ?? ""
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
			if (editingProduct) {
				const payload: ProductoUpdateRequest = {
					nombre: form.nombre.trim(),
					descripcion: form.descripcion.trim() || undefined,
					unidadMedida: form.unidadMedida,
					precioVenta: parseDecimalInput(form.precioVenta),
					costo: parseDecimalInput(form.costo),
					stockMinimo: parseDecimalInput(form.stockMinimo)
				};
				const updated = await productoService.actualizar(editingProduct.id, payload);
				setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
			} else {
				const payload: ProductoCreateRequest = {
					empresaId,
					categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
					sku: form.sku.trim() || undefined,
					nombre: form.nombre.trim(),
					descripcion: form.descripcion.trim() || undefined,
					unidadMedida: form.unidadMedida,
					precioVenta: parseDecimalInput(form.precioVenta),
					costo: parseDecimalInput(form.costo),
					stockMinimo: parseDecimalInput(form.stockMinimo),
					stockInicial: parseDecimalInput(form.stockInicial)
				};
				const created = await productoService.crear(payload);
				setProducts((prev) => [...prev, created]);
			}
			closeModal();
		} catch {
			setFormError("No se pudo guardar el producto. Intenta nuevamente.");
		} finally {
			setSaving(false);
		}
	}, [closeModal, editingProduct, empresaId, form]);

	const openConfirmDelete = useCallback((product: Producto) => {
		setConfirmTarget(product);
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
			await productoService.eliminar(confirmTarget.id);
			setProducts((prev) => prev.filter((p) => p.id !== confirmTarget.id));
			closeConfirm();
		} catch {
			setError("No se pudo eliminar el producto. Intenta nuevamente.");
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

	const categoryFilterOptions = useMemo(() => ["Todos", ...categories.map((c) => c.nombre)], [categories]);

	useEffect(() => {
		if (!categoryFilterOptions.includes(selectedCategory)) {
			setSelectedCategory("Todos");
		}
	}, [categoryFilterOptions, selectedCategory]);

	const filteredProducts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return products.filter((p) => {
			const matchesSearch =
				q.length === 0 ||
				p.nombre.toLowerCase().includes(q) ||
				(p.sku?.toLowerCase().includes(q) ?? false) ||
				(p.descripcion?.toLowerCase().includes(q) ?? false);

			const matchesCategory = selectedCategory === "Todos" || p.categoriaNombre === selectedCategory;

			return matchesSearch && matchesCategory;
		});
	}, [products, searchQuery, selectedCategory]);

	const columns: Array<DataTableColumn<Producto>> = useMemo(
		() => [
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "categoria", header: "Categoría", render: (r) => r.categoriaNombre || "—" },
			{ key: "costo", header: "Costo", align: "right", render: (r) => formatCurrency(r.costo) },
			{ key: "precioVenta", header: "Precio venta", align: "right", render: (r) => formatCurrency(r.precioVenta) },
			{ key: "stockActual", header: "Stock", align: "right", render: (r) => (r.stockActual ?? 0).toLocaleString("es-CO") },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.active ? "Activo" : "Inactivo"} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="prod__actions">
						<SecondaryButton type="button" className="prod__actionBtn" onClick={() => openEditModal(r)}>
							<Pencil size={14} strokeWidth={2} />
							<span>Editar</span>
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className="prod__actionBtn prod__actionBtn--danger"
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
		if (products.length === 0) {
			return (
				<div className="prod__empty">
					<div className="prod__emptyTitle">No hay productos registrados.</div>
					<div className="prod__emptySubtitle">
						Presiona <span className="prod__emptyEmph">"Nuevo Producto"</span> para crear el primer producto.
					</div>
				</div>
			);
		}

		return (
			<div className="prod__empty">
				<div className="prod__emptyTitle">No se encontraron productos.</div>
				<div className="prod__emptySubtitle">Prueba modificando la búsqueda o los filtros.</div>
			</div>
		);
	}, [products.length]);

	if (loading) {
		return (
			<div className="prod">
				<LoadingState label="Cargando productos..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="prod">
				<div className="prod__state prod__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="prod">
			<PageHeader
				title="Productos"
				subtitle="Administración de productos del negocio."
				actions={
					<PrimaryButton type="button" onClick={openCreateModal}>
						<Plus size={16} strokeWidth={2.2} />
						<span>Nuevo Producto</span>
					</PrimaryButton>
				}
			/>

			<div className="prod__controls">
				<div className="prod__search">
					<label className="prod__searchLabel" aria-hidden="true">
						Buscar
					</label>
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar producto..." />
					</div>
				</div>

				<div className="prod__filters" aria-label="Filtros">
					<div className="prod__filter">
						<label className="prod__filterLabel">Categoría</label>
						<select
							className="prod__select"
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
						>
							{categoryFilterOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<div className="prod__table">
				<DataTable columns={columns} data={filteredProducts} emptyState={emptyState} />
			</div>

			<Modal
				open={modalOpen}
				title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
				onClose={closeModal}
				footer={
					<div className="prod__modalActions">
						<SecondaryButton type="button" onClick={closeModal} disabled={saving}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={saving || (!editingProduct && !hasActiveCategories)}>
							{saving ? "Guardando..." : "Guardar"}
						</PrimaryButton>
					</div>
				}
			>
				{!editingProduct && !hasActiveCategories ? (
					<div className="prod__noCats">
						<div className="prod__noCatsTitle">Debes crear al menos una categoría antes de registrar productos.</div>
						<div className="prod__noCatsActions">
							<SecondaryButton
								type="button"
								onClick={() => {
									closeModal();
									navigate("/categorias");
								}}
							>
								Ir a Categorías
							</SecondaryButton>
						</div>
					</div>
				) : null}

				<form className="prod__form" onSubmit={(e) => e.preventDefault()}>
					<div className="prod__grid">
						<div className="prod__field">
							<label className="prod__label">Nombre del producto</label>
							<input
								className="prod__input"
								type="text"
								placeholder="Ej: Café americano"
								value={form.nombre}
								onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
							/>
						</div>

						<div className="prod__field">
							<label className="prod__label">SKU (opcional)</label>
							<input
								className="prod__input"
								type="text"
								placeholder="Ej: CAF-001"
								value={form.sku}
								onChange={(e) => setForm((v) => ({ ...v, sku: e.target.value }))}
							/>
						</div>

						{!editingProduct ? (
							<div className="prod__field">
								<label className="prod__label">Categoría</label>
								<select
									className="prod__select"
									value={form.categoriaId}
									onChange={(e) => setForm((v) => ({ ...v, categoriaId: e.target.value }))}
									disabled={!hasActiveCategories}
								>
									<option value="">Sin categoría</option>
									{activeCategories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nombre}
										</option>
									))}
								</select>
							</div>
						) : (
							<div className="prod__field">
								<label className="prod__label">Categoría</label>
								<input className="prod__input" type="text" value={editingProduct.categoriaNombre || "—"} disabled />
							</div>
						)}

						<div className="prod__field">
							<label className="prod__label">Unidad de medida</label>
							<select
								className="prod__select"
								value={form.unidadMedida}
								onChange={(e) => setForm((v) => ({ ...v, unidadMedida: e.target.value }))}
							>
								{UNIDADES_MEDIDA.map((u) => (
									<option key={u} value={u}>
										{u}
									</option>
								))}
							</select>
						</div>

						<div className="prod__field">
							<label className="prod__label">Costo</label>
							<input
								className="prod__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={form.costo}
								onChange={(e) => setForm((v) => ({ ...v, costo: e.target.value }))}
							/>
						</div>

						<div className="prod__field">
							<label className="prod__label">Precio de venta</label>
							<input
								className="prod__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={form.precioVenta}
								onChange={(e) => setForm((v) => ({ ...v, precioVenta: e.target.value }))}
							/>
						</div>

						<div className="prod__field">
							<label className="prod__label">Stock mínimo</label>
							<input
								className="prod__input"
								type="text"
								placeholder="0"
								inputMode="decimal"
								value={form.stockMinimo}
								onChange={(e) => setForm((v) => ({ ...v, stockMinimo: e.target.value }))}
							/>
						</div>

						<div className="prod__field">
							<label className="prod__label">{editingProduct ? "Stock actual" : "Stock inicial"}</label>
							<input
								className="prod__input"
								type="text"
								placeholder="0"
								inputMode="decimal"
								value={form.stockInicial}
								disabled={Boolean(editingProduct)}
								onChange={(e) => setForm((v) => ({ ...v, stockInicial: e.target.value }))}
							/>
							{editingProduct ? (
								<span className="prod__hint">El stock se ajusta desde el módulo de Inventario.</span>
							) : null}
						</div>

						<div className="prod__field prod__field--full">
							<label className="prod__label">Descripción (opcional)</label>
							<textarea
								className="prod__textarea"
								rows={3}
								placeholder="Descripción corta del producto..."
								value={form.descripcion}
								onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
							/>
						</div>

						{formError ? <div className="prod__field prod__field--full prod__formError">{formError}</div> : null}
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title="Eliminar producto"
				message={`¿Deseas eliminar el producto "${confirmTarget?.nombre ?? ""}"? Esta acción no se puede deshacer desde aquí.`}
				confirmText={deleting ? "Eliminando..." : "Eliminar"}
				cancelText="Cancelar"
				onConfirm={confirmDelete}
				onCancel={closeConfirm}
			/>
		</div>
	);
}