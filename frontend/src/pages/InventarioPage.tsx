import { useEffect, useMemo, useRef, useState } from "react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SecondaryButton from "../components/SecondaryButton";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import { getCategories } from "../services/categoryStorage";
import { getProducts, type Product } from "../services/productStorage";
import { getSettings } from "../services/settingsStorage";
import "./InventarioPage.css";

type StockLevel = "Agotado" | "Stock Bajo" | "Disponible";

type InventoryRow = {
	id: string;
	producto: string;
	categoria: string;
	stock: number;
	stockMinimo: number;
	unidad: string;
	estadoInventario: StockLevel;
	productoEstado: Product["estado"];
	raw: Product;
};

const DEFAULT_STOCK_MIN = 5;
const DEFAULT_UNIT = "Und";

function getStockLevel(stock: number, stockMinimo: number): StockLevel {
	if (stock === 0) return "Agotado";
	if (stock <= stockMinimo) return "Stock Bajo";
	return "Disponible";
}

function formatCurrency(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateLabel(value: string) {
	if (!value) return "";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

export default function InventarioPage() {
	const [products] = useState<Product[]>(() => getProducts());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Todos");
	const [selectedStockStatus, setSelectedStockStatus] = useState<StockLevel | "Todos">("Todos");
	const searchRef = useRef<HTMLDivElement | null>(null);
	const stockMinimoConfig = useMemo(() => getSettings()?.system.defaultMinStock ?? DEFAULT_STOCK_MIN, []);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewProductId, setViewProductId] = useState<string | null>(null);

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

	const categoryOptions = useMemo(() => {
		return ["Todos", ...activeCategoryNames];
	}, [activeCategoryNames]);

	useEffect(() => {
		if (!categoryOptions.includes(selectedCategory)) {
			setSelectedCategory("Todos");
		}
	}, [categoryOptions, selectedCategory]);

	const rows: InventoryRow[] = useMemo(() => {
		return products.map((p) => {
			const stockMinimo = stockMinimoConfig;
			const unidad = DEFAULT_UNIT;
			return {
				id: p.id,
				producto: p.nombre,
				categoria: p.categoria,
				stock: p.stock,
				stockMinimo,
				unidad,
				estadoInventario: getStockLevel(p.stock, stockMinimo),
				productoEstado: p.estado,
				raw: p
			};
		});
	}, [products, stockMinimoConfig]);

	const filteredRows = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return rows.filter((r) => {
			const matchesSearch = q.length === 0 || r.producto.toLowerCase().includes(q);
			const matchesCategory = selectedCategory === "Todos" || r.categoria === selectedCategory;
			const matchesStock = selectedStockStatus === "Todos" || r.estadoInventario === selectedStockStatus;
			return matchesSearch && matchesCategory && matchesStock;
		});
	}, [rows, searchQuery, selectedCategory, selectedStockStatus]);

	const openView = (productId: string) => {
		setViewProductId(productId);
		setViewOpen(true);
	};

	const closeView = () => {
		setViewOpen(false);
		setViewProductId(null);
	};

	const viewRow = useMemo(() => {
		if (!viewProductId) return null;
		return rows.find((r) => r.id === viewProductId) ?? null;
	}, [rows, viewProductId]);

	const columns: Array<DataTableColumn<InventoryRow>> = useMemo(
		() => [
			{ key: "producto", header: "Producto", render: (r) => r.producto },
			{ key: "categoria", header: "Categoría", render: (r) => r.categoria },
			{ key: "stock", header: "Stock", align: "right", render: (r) => r.stock.toLocaleString("es-CO") },
			{
				key: "stockMinimo",
				header: "Stock mínimo",
				align: "right",
				render: (r) => r.stockMinimo.toLocaleString("es-CO")
			},
			{ key: "unidad", header: "Unidad", render: (r) => r.unidad },
			{
				key: "estado",
				header: "Estado",
				render: (r) => {
					if (r.estadoInventario === "Agotado") {
						return (
							<span className="inv__stockBadge inv__stockBadge--out">
								<StatusBadge status="Anulado" />
							</span>
						);
					}

					if (r.estadoInventario === "Stock Bajo") {
						return (
							<span className="inv__stockBadge inv__stockBadge--low">
								<StatusBadge status="Pendiente" />
							</span>
						);
					}

					return (
						<span className="inv__stockBadge inv__stockBadge--ok">
							<StatusBadge status="Activo" />
						</span>
					);
				}
			},
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="inv__actions">
						<SecondaryButton type="button" className="inv__actionBtn" onClick={() => openView(r.id)}>
							Ver
						</SecondaryButton>
					</div>
				)
			}
		],
		[]
	);

	return (
		<div className="inv">
			<PageHeader title="Inventario" subtitle="Consulta del inventario disponible." />

			<div className="inv__controls">
				<div className="inv__search">
					<div ref={searchRef}>
						<SearchBar placeholder="Buscar producto..." />
					</div>
				</div>

				<div className="inv__filters" aria-label="Filtros">
					<div className="inv__filter">
						<label className="inv__filterLabel">Categoría</label>
						<select className="inv__select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
							{categoryOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>

					<div className="inv__filter">
						<label className="inv__filterLabel">Estado</label>
						<select
							className="inv__select"
							value={selectedStockStatus}
							onChange={(e) => setSelectedStockStatus(e.target.value as StockLevel | "Todos")}
						>
							<option value="Todos">Todos</option>
							<option value="Disponible">Disponible</option>
							<option value="Stock Bajo">Stock Bajo</option>
							<option value="Agotado">Agotado</option>
						</select>
					</div>
				</div>
			</div>

			<div className="inv__table">
				<DataTable
					columns={columns}
					data={filteredRows}
					emptyState={
						products.length === 0 ? (
							<div className="inv__empty">
								<div className="inv__emptyTitle">No hay productos registrados.</div>
								<div className="inv__emptySubtitle">Crea el primer producto para empezar a consultar el inventario.</div>
							</div>
						) : (
							<div className="inv__empty">
								<div className="inv__emptyTitle">No se encontraron productos.</div>
								<div className="inv__emptySubtitle">Prueba modificando la búsqueda o los filtros.</div>
							</div>
						)
					}
				/>
			</div>

			<Modal
				open={viewOpen}
				title="Detalle de producto"
				onClose={closeView}
				footer={
					<div className="inv__modalActions">
						<SecondaryButton type="button" onClick={closeView}>
							Cerrar
						</SecondaryButton>
					</div>
				}
			>
				{viewRow ? (
					<div className="inv__details">
						<div className="inv__imagePreview" style={viewRow.raw.imagen ? { backgroundImage: `url(${viewRow.raw.imagen})` } : undefined} />
						<div className="inv__detailGrid">
							<div className="inv__detail">
								<div className="inv__detailLabel">Producto</div>
								<div className="inv__detailValue">{viewRow.raw.nombre}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Categoría</div>
								<div className="inv__detailValue">{viewRow.raw.categoria}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Stock</div>
								<div className="inv__detailValue">{viewRow.stock.toLocaleString("es-CO")}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Stock mínimo</div>
								<div className="inv__detailValue">{viewRow.stockMinimo.toLocaleString("es-CO")}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Unidad</div>
								<div className="inv__detailValue">{viewRow.unidad}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Estado del producto</div>
								<div className="inv__detailValue">{viewRow.productoEstado}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Precio compra</div>
								<div className="inv__detailValue">{formatCurrency(viewRow.raw.precioCompra)}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Precio venta</div>
								<div className="inv__detailValue">{formatCurrency(viewRow.raw.precioVenta)}</div>
							</div>
							<div className="inv__detail inv__detail--full">
								<div className="inv__detailLabel">Descripción</div>
								<div className="inv__detailValue">{viewRow.raw.descripcion ?? ""}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Creado</div>
								<div className="inv__detailValue">{formatDateLabel(viewRow.raw.createdAt)}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Actualizado</div>
								<div className="inv__detailValue">{formatDateLabel(viewRow.raw.updatedAt)}</div>
							</div>
						</div>
					</div>
				) : null}
			</Modal>
		</div>
	);
}
