import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryStorage";
import { addProduct, getProducts, updateProduct, type Product, type ProductStatus } from "../services/productStorage";
import "./ProductosPage.css";

type ProductFormState = {
	nombre: string;
	categoria: string;
	precioCompra: string;
	precioVenta: string;
	stock: string;
	estado: ProductStatus;
	imagen: string;
	descripcion: string;
};

const defaultFormState: ProductFormState = {
	nombre: "",
	categoria: "",
	precioCompra: "",
	precioVenta: "",
	stock: "",
	estado: "Activo",
	imagen: "",
	descripcion: ""
};

function parseDecimalInput(value: string) {
	const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : 0;
}

function parseIntegerInput(value: string) {
	const normalized = value.replace(/[^\d-]/g, "");
	const n = Number(normalized);
	return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function ProductosPage() {
	const navigate = useNavigate();
	const [modalOpen, setModalOpen] = useState(false);
	const [products, setProducts] = useState<Product[]>(() => getProducts());
	const [form, setForm] = useState<ProductFormState>(defaultFormState);
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Todos");
	const [selectedStatus, setSelectedStatus] = useState<ProductStatus | "Todos">("Todos");
	const searchRef = useRef<HTMLDivElement | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<{ id: string; nextStatus: ProductStatus } | null>(null);

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setEditingProductId(null);
	}, []);

	const openModal = useCallback(() => {
		setForm(defaultFormState);
		setEditingProductId(null);
		setModalOpen(true);
	}, []);

	const openEditModal = useCallback((product: Product) => {
		setEditingProductId(product.id);
		setForm({
			nombre: product.nombre,
			categoria: product.categoria,
			precioCompra: String(product.precioCompra),
			precioVenta: String(product.precioVenta),
			stock: String(product.stock),
			estado: product.estado,
			imagen: product.imagen ?? "",
			descripcion: product.descripcion ?? ""
		});
		setModalOpen(true);
	}, []);

	const openConfirmStatusChange = useCallback((product: Product) => {
		setConfirmTarget({
			id: product.id,
			nextStatus: product.estado === "Activo" ? "Inactivo" : "Activo"
		});
		setConfirmOpen(true);
	}, []);

	const closeConfirm = useCallback(() => {
		setConfirmOpen(false);
		setConfirmTarget(null);
	}, []);

	const confirmStatusChange = useCallback(() => {
		if (!confirmTarget) return;

		const updated = updateProduct(confirmTarget.id, { estado: confirmTarget.nextStatus });
		if (updated) {
			setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
		}

		closeConfirm();
	}, [closeConfirm, confirmTarget]);

	const handleSave = () => {
		if (editingProductId) {
			const updated = updateProduct(editingProductId, {
				nombre: form.nombre,
				categoria: form.categoria,
				precioCompra: parseDecimalInput(form.precioCompra),
				precioVenta: parseDecimalInput(form.precioVenta),
				stock: parseIntegerInput(form.stock),
				estado: form.estado,
				imagen: form.imagen,
				descripcion: form.descripcion
			});

			if (updated) {
				setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
			}

			closeModal();
			return;
		}

		const created = addProduct({
			nombre: form.nombre,
			categoria: form.categoria,
			precioCompra: parseDecimalInput(form.precioCompra),
			precioVenta: parseDecimalInput(form.precioVenta),
			stock: parseIntegerInput(form.stock),
			estado: form.estado,
			imagen: form.imagen,
			descripcion: form.descripcion
		});

		setProducts((prev) => [...prev, created]);
		closeModal();
	};

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

	const activeCategoryNames = useMemo(() => {
		return getCategories()
			.filter((c) => c.estado === "Activo")
			.map((c) => c.nombre);
	}, []);

	const hasActiveCategories = activeCategoryNames.length > 0;

	const categoryOptions = useMemo(() => {
		return ["Todos", ...activeCategoryNames];
	}, [activeCategoryNames]);

	const formCategoryOptions = useMemo(() => {
		const options = [...activeCategoryNames];
		if (!form.categoria) return options;
		if (options.includes(form.categoria)) return options;
		return [...options, form.categoria];
	}, [activeCategoryNames, form.categoria]);

	useEffect(() => {
		if (!categoryOptions.includes(selectedCategory)) {
			setSelectedCategory("Todos");
		}
	}, [categoryOptions, selectedCategory]);

	const filteredProducts = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return products.filter((p) => {
			const matchesSearch =
				q.length === 0 ||
				p.nombre.toLowerCase().includes(q) ||
				(p.descripcion?.toLowerCase().includes(q) ?? false);

			const matchesStatus = selectedStatus === "Todos" || p.estado === selectedStatus;

			const matchesCategory = selectedCategory === "Todos" || p.categoria === selectedCategory;

			return matchesSearch && matchesStatus && matchesCategory;
		});
	}, [products, searchQuery, selectedCategory, selectedStatus]);

	const columns: Array<DataTableColumn<Product>> = useMemo(
		() => [
			{
				key: "imagen",
				header: "Imagen",
				render: (r) => (
					<div
						className="prod__imageCell"
						aria-hidden="true"
						style={
							r.imagen
								? {
										backgroundImage: `url(${r.imagen})`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										backgroundRepeat: "no-repeat"
									}
								: undefined
						}
					/>
				)
			},
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "categoria", header: "Categoría", render: (r) => r.categoria },
			{ key: "precioCompra", header: "Precio compra", align: "right", render: (r) => formatCurrency(r.precioCompra) },
			{ key: "precioVenta", header: "Precio venta", align: "right", render: (r) => formatCurrency(r.precioVenta) },
			{ key: "stock", header: "Stock", align: "right", render: (r) => r.stock.toLocaleString("es-CO") },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.estado} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="prod__actions">
						<SecondaryButton type="button" className="prod__actionBtn" onClick={() => openEditModal(r)}>
							Editar
						</SecondaryButton>
						{r.estado === "Activo" ? (
							<SecondaryButton
								type="button"
								className="prod__actionBtn prod__actionBtn--danger"
								onClick={() => openConfirmStatusChange(r)}
							>
								Desactivar
							</SecondaryButton>
						) : (
							<SecondaryButton type="button" className="prod__actionBtn" onClick={() => openConfirmStatusChange(r)}>
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
		<div className="prod">
			<PageHeader
				title="Productos"
				subtitle="Administración de productos del negocio."
				actions={
					<PrimaryButton type="button" onClick={openModal}>
						+ Nuevo Producto
					</PrimaryButton>
				}
			/>

			<div className="prod__controls">
				<div className="prod__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar producto..." />
					</div>
				</div>

				<div className="prod__filters" aria-label="Filtros">
					<div className="prod__filter">
						<label className="prod__filterLabel">Categoría</label>
						<select className="prod__select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
							{categoryOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
					<div className="prod__filter">
						<label className="prod__filterLabel">Estado</label>
						<select className="prod__select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as ProductStatus | "Todos")}>
							<option value="Todos">Todos</option>
							<option value="Activo">Activo</option>
							<option value="Inactivo">Inactivo</option>
						</select>
					</div>
				</div>
			</div>

			<div className="prod__table">
				<DataTable
					columns={columns}
					data={filteredProducts}
					emptyState={
						products.length === 0 ? (
							<div className="prod__empty">
								<div className="prod__emptyTitle">No hay productos registrados.</div>
								<div className="prod__emptySubtitle">
									Presiona <span className="prod__emptyEmph">"Nuevo Producto"</span> para crear el primer producto.
								</div>
							</div>
						) : (
							<div className="prod__empty">
								<div className="prod__emptyTitle">No se encontraron productos.</div>
								<div className="prod__emptySubtitle">Prueba modificando la búsqueda o los filtros.</div>
							</div>
						)
					}
				/>
			</div>

			<Modal
				open={modalOpen}
				title={editingProductId ? "Editar Producto" : "Nuevo Producto"}
				onClose={closeModal}
				footer={
					<div className="prod__modalActions">
						<SecondaryButton type="button" onClick={closeModal}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={handleSave} disabled={!hasActiveCategories}>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				{!hasActiveCategories ? (
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
							<label className="prod__label">Categoría</label>
							<select
								className="prod__select"
								value={form.categoria}
								onChange={(e) => setForm((v) => ({ ...v, categoria: e.target.value }))}
								disabled={!hasActiveCategories}
							>
								<option value="" disabled>
									Seleccionar...
								</option>
								{formCategoryOptions.map((c) => {
									const isCurrentNotActive = c === form.categoria && !activeCategoryNames.includes(form.categoria);
									return (
										<option key={c} value={c} disabled={isCurrentNotActive}>
											{isCurrentNotActive ? `${c} (Inactiva)` : c}
										</option>
									);
								})}
							</select>
						</div>

						<div className="prod__field">
							<label className="prod__label">Precio de compra</label>
							<input
								className="prod__input"
								type="text"
								placeholder="$0"
								inputMode="decimal"
								value={form.precioCompra}
								onChange={(e) => setForm((v) => ({ ...v, precioCompra: e.target.value }))}
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
							<label className="prod__label">Stock inicial</label>
							<input
								className="prod__input"
								type="text"
								placeholder="0"
								inputMode="numeric"
								value={form.stock}
								onChange={(e) => setForm((v) => ({ ...v, stock: e.target.value }))}
							/>
						</div>

						<div className="prod__field">
							<label className="prod__label">Estado</label>
							<select
								className="prod__select"
								value={form.estado}
								onChange={(e) => setForm((v) => ({ ...v, estado: e.target.value as ProductStatus }))}
							>
								<option value="Activo">Activo</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>

						<div className="prod__field prod__field--full">
							<label className="prod__label">Imagen (opcional)</label>
							<input
								className="prod__input"
								type="text"
								placeholder="URL de la imagen"
								value={form.imagen}
								onChange={(e) => setForm((v) => ({ ...v, imagen: e.target.value }))}
							/>
						</div>

						<div className="prod__field prod__field--full">
							<label className="prod__label">Descripción corta (opcional)</label>
							<textarea
								className="prod__textarea"
								rows={3}
								placeholder="Descripción corta del producto..."
								value={form.descripcion}
								onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
							/>
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar producto" : "Activar producto"}
				message={
					confirmTarget?.nextStatus === "Inactivo"
						? "¿Deseas desactivar este producto?"
						: "¿Deseas volver a activar este producto?"
				}
				confirmText={confirmTarget?.nextStatus === "Inactivo" ? "Desactivar" : "Activar"}
				cancelText="Cancelar"
				onConfirm={confirmStatusChange}
				onCancel={closeConfirm}
			/>
		</div>
	);
}
