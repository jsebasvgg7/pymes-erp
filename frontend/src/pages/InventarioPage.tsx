import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SecondaryButton from "../components/SecondaryButton";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { productoService, type Producto } from "../services/ProductoService";
import "./InventarioPage.css";

type StockLevel = "Agotado" | "Stock Bajo" | "Disponible";

function getStockLevel(stock: number, stockMinimo: number): StockLevel {
	if (stock <= 0) return "Agotado";
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
	const empresaId = authService.getUsuario()?.empresaId;

	const [products, setProducts] = useState<Producto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Todos");
	const [selectedStockStatus, setSelectedStockStatus] = useState<StockLevel | "Todos">("Todos");
	const searchRef = useRef<HTMLDivElement | null>(null);

	const [viewOpen, setViewOpen] = useState(false);
	const [viewProductId, setViewProductId] = useState<number | null>(null);

	const loadProducts = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const data = await productoService.listarPorEmpresa(empresaId, 0, 200);
			setProducts(data.content);
		} catch {
			setError("No se pudo cargar el inventario. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

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

	const categoryOptions = useMemo(() => {
		const names = Array.from(new Set(products.map((p) => p.categoriaNombre).filter(Boolean)));
		return ["Todos", ...names];
	}, [products]);

	useEffect(() => {
		if (!categoryOptions.includes(selectedCategory)) {
			setSelectedCategory("Todos");
		}
	}, [categoryOptions, selectedCategory]);

	const rows = useMemo(() => {
		return products.map((p) => {
			const stock = p.stockActual ?? 0;
			const stockMinimo = p.stockMinimo ?? 0;
			return {
				id: p.id,
				producto: p.nombre,
				categoria: p.categoriaNombre || "—",
				stock,
				stockMinimo,
				unidad: p.unidadMedida || "—",
				estadoInventario: getStockLevel(stock, stockMinimo),
				raw: p
			};
		});
	}, [products]);

	type InventoryRow = (typeof rows)[number];

	const filteredRows = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return rows.filter((r) => {
			const matchesSearch = q.length === 0 || r.producto.toLowerCase().includes(q);
			const matchesCategory = selectedCategory === "Todos" || r.categoria === selectedCategory;
			const matchesStock = selectedStockStatus === "Todos" || r.estadoInventario === selectedStockStatus;
			return matchesSearch && matchesCategory && matchesStock;
		});
	}, [rows, searchQuery, selectedCategory, selectedStockStatus]);

	const openView = (productId: number) => {
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
						return <span className="inv__stockBadge inv__stockBadge--out">Agotado</span>;
					}

					if (r.estadoInventario === "Stock Bajo") {
						return <span className="inv__stockBadge inv__stockBadge--low">Stock Bajo</span>;
					}

					return <span className="inv__stockBadge inv__stockBadge--ok">Disponible</span>;
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

	const emptyState = useMemo(() => {
		if (products.length === 0) {
			return (
				<div className="inv__empty">
					<div className="inv__emptyTitle">No hay productos registrados.</div>
					<div className="inv__emptySubtitle">Crea el primer producto para empezar a consultar el inventario.</div>
				</div>
			);
		}

		return (
			<div className="inv__empty">
				<div className="inv__emptyTitle">No se encontraron productos.</div>
				<div className="inv__emptySubtitle">Prueba modificando la búsqueda o los filtros.</div>
			</div>
		);
	}, [products.length]);

	if (loading) {
		return (
			<div className="inv">
				<LoadingState label="Cargando inventario..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="inv">
				<div className="inv__state inv__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="inv">
			<PageHeader title="Inventario" subtitle="Consulta del inventario disponible." />

			<div className="inv__controls">
				<div className="inv__search">
					<label className="inv__searchLabel" aria-hidden="true">
						Buscar
					</label>
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
				<DataTable columns={columns} data={filteredRows} emptyState={emptyState} />
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
						<div className="inv__detailGrid">
							<div className="inv__detail">
								<div className="inv__detailLabel">Producto</div>
								<div className="inv__detailValue">{viewRow.raw.nombre}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Categoría</div>
								<div className="inv__detailValue">{viewRow.categoria}</div>
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
								<div className="inv__detailLabel">Estado</div>
								<div className="inv__detailValue">
									<StatusBadge status={viewRow.raw.active ? "Activo" : "Inactivo"} />
								</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Costo</div>
								<div className="inv__detailValue">{formatCurrency(viewRow.raw.costo ?? 0)}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Costo promedio</div>
								<div className="inv__detailValue">{formatCurrency(viewRow.raw.costoPromedio ?? 0)}</div>
							</div>
							<div className="inv__detail">
								<div className="inv__detailLabel">Precio venta</div>
								<div className="inv__detailValue">{formatCurrency(viewRow.raw.precioVenta ?? 0)}</div>
							</div>
							<div className="inv__detail inv__detail--full">
								<div className="inv__detailLabel">Descripción</div>
								<div className="inv__detailValue">{viewRow.raw.descripcion || "—"}</div>
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