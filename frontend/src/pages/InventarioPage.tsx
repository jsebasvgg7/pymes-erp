import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, History } from "lucide-react";
import DataTable, { DataTableColumn } from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import SearchBar from "../components/SearchBar";
import { authService } from "../services/authService";
import { inventarioService, type Inventario, type MovimientoInventario, type TipoMovimientoInventario } from "../services/inventarioService";
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

function formatDateTime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-CO");
}

function parseDecimalInput(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

type AjusteFormState = {
  tipo: TipoMovimientoInventario;
  cantidad: string;
  motivo: string;
  notas: string;
};

const defaultAjusteForm: AjusteFormState = {
  tipo: "ENTRADA",
  cantidad: "",
  motivo: "",
  notas: ""
};

export default function InventarioPage() {
  const empresaId = authService.getUsuario()?.empresaId;
  const usuarioId = authService.getUsuario()?.id;

  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockLevel | "Todos">("Todos");
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Modal de ajuste
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteTarget, setAjusteTarget] = useState<Inventario | null>(null);
  const [ajusteForm, setAjusteForm] = useState<AjusteFormState>(defaultAjusteForm);
  const [savingAjuste, setSavingAjuste] = useState(false);
  const [ajusteError, setAjusteError] = useState<string | null>(null);

  // Modal de historial
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Inventario | null>(null);
  const [historyMovimientos, setHistoryMovimientos] = useState<MovimientoInventario[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadInventario = useCallback(async () => {
    if (!empresaId) {
      setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await inventarioService.listarPorEmpresa(empresaId);
      setInventarios(data);
    } catch {
      setError("No se pudo cargar el inventario. Verifica tu conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadInventario();
  }, [loadInventario]);

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
    const names = Array.from(new Set(inventarios.map((i) => i.categoriaNombre).filter(Boolean) as string[]));
    return ["Todos", ...names];
  }, [inventarios]);

  useEffect(() => {
    if (!categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("Todos");
    }
  }, [categoryOptions, selectedCategory]);

  const rows = useMemo(() => {
    return inventarios.map((inv) => ({
      ...inv,
      estadoInventario: getStockLevel(inv.cantidadActual, inv.stockMinimo)
    }));
  }, [inventarios]);

  type Row = (typeof rows)[number];

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = q.length === 0 || r.productoNombre.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "Todos" || r.categoriaNombre === selectedCategory;
      const matchesStock = selectedStockStatus === "Todos" || r.estadoInventario === selectedStockStatus;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [rows, searchQuery, selectedCategory, selectedStockStatus]);

  // ========== AJUSTE ==========

  const openAjuste = useCallback((inv: Inventario) => {
    setAjusteTarget(inv);
    setAjusteForm(defaultAjusteForm);
    setAjusteError(null);
    setAjusteOpen(true);
  }, []);

  const closeAjuste = useCallback(() => {
    if (savingAjuste) return;
    setAjusteOpen(false);
    setAjusteTarget(null);
    setAjusteError(null);
  }, [savingAjuste]);

  const isAjusteValid = useMemo(() => {
    const cantidad = parseDecimalInput(ajusteForm.cantidad);
    return cantidad > 0 && ajusteForm.motivo.trim().length > 0;
  }, [ajusteForm.cantidad, ajusteForm.motivo]);

  const handleGuardarAjuste = useCallback(async () => {
    if (!isAjusteValid || !empresaId || !ajusteTarget) return;

    setSavingAjuste(true);
    setAjusteError(null);
    try {
      await inventarioService.ajustarStock({
        empresaId,
        productoId: ajusteTarget.productoId,
        usuarioId,
        tipo: ajusteForm.tipo,
        cantidad: parseDecimalInput(ajusteForm.cantidad),
        motivo: ajusteForm.motivo.trim(),
        notas: ajusteForm.notas.trim() || undefined
      });

      await loadInventario();
      closeAjuste();
    } catch (err) {
      setAjusteError(extractErrorMessage(err, "No se pudo guardar el ajuste. Intenta nuevamente."));
    } finally {
      setSavingAjuste(false);
    }
  }, [ajusteForm, ajusteTarget, closeAjuste, empresaId, isAjusteValid, loadInventario, usuarioId]);

  // ========== HISTORIAL ==========

  const openHistory = useCallback(async (inv: Inventario) => {
    setHistoryTarget(inv);
    setHistoryOpen(true);
    setLoadingHistory(true);
    setHistoryMovimientos([]);
    try {
      const data = await inventarioService.obtenerMovimientosPorProducto(inv.productoId);
      setHistoryMovimientos(data);
    } catch {
      setHistoryMovimientos([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setHistoryTarget(null);
    setHistoryMovimientos([]);
  }, []);

  // ========== COLUMNAS ==========

  const columns: Array<DataTableColumn<Row>> = useMemo(
    () => [
      { key: "producto", header: "Producto", render: (r) => r.productoNombre },
      { key: "categoria", header: "Categoría", render: (r) => r.categoriaNombre || "—" },
      { key: "stock", header: "Stock", align: "right", render: (r) => r.cantidadActual.toLocaleString("es-CO") },
      {
        key: "stockMinimo",
        header: "Stock mínimo",
        align: "right",
        render: (r) => r.stockMinimo.toLocaleString("es-CO")
      },
      { key: "unidad", header: "Unidad", render: (r) => r.unidadMedida },
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
            <SecondaryButton type="button" className="inv__actionBtn" onClick={() => openAjuste(r)}>
              <SlidersHorizontal size={14} strokeWidth={2} />
              <span>Ajustar</span>
            </SecondaryButton>
            <SecondaryButton type="button" className="inv__actionBtn" onClick={() => openHistory(r)}>
              <History size={14} strokeWidth={2} />
              <span>Historial</span>
            </SecondaryButton>
          </div>
        )
      }
    ],
    [openAjuste, openHistory]
  );

  const emptyState = useMemo(() => {
    if (inventarios.length === 0) {
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
  }, [inventarios.length]);

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
      <PageHeader title="Inventario" subtitle="Consulta y ajusta el inventario disponible." />

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

      {/* ============ MODAL AJUSTE ============ */}
      <Modal
        open={ajusteOpen}
        title={`Ajustar stock — ${ajusteTarget?.productoNombre ?? ""}`}
        onClose={closeAjuste}
        footer={
          <div className="inv__modalActions">
            <SecondaryButton type="button" onClick={closeAjuste} disabled={savingAjuste}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="button" onClick={handleGuardarAjuste} disabled={!isAjusteValid || savingAjuste}>
              {savingAjuste ? "Guardando..." : "Guardar Ajuste"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="inv__details">
          {ajusteTarget ? (
            <div className="inv__detail">
              <div className="inv__detailLabel">Stock actual</div>
              <div className="inv__detailValue">
                {ajusteTarget.cantidadActual.toLocaleString("es-CO")} {ajusteTarget.unidadMedida}
              </div>
            </div>
          ) : null}

          <div className="inv__detailGrid">
            <div className="inv__detail">
              <div className="inv__detailLabel">Tipo de ajuste</div>
              <select
                className="inv__select"
                value={ajusteForm.tipo}
                onChange={(e) => setAjusteForm((v) => ({ ...v, tipo: e.target.value as TipoMovimientoInventario }))}
              >
                <option value="ENTRADA">Entrada (sumar stock)</option>
                <option value="SALIDA">Salida (restar stock)</option>
                <option value="CONTEO">Conteo (fijar stock)</option>
              </select>
            </div>

            <div className="inv__detail">
              <div className="inv__detailLabel">
                {ajusteForm.tipo === "CONTEO" ? "Cantidad final" : "Cantidad"}
              </div>
              <input
                className="inv__select"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={ajusteForm.cantidad}
                onChange={(e) => setAjusteForm((v) => ({ ...v, cantidad: e.target.value }))}
              />
            </div>

            <div className="inv__detail inv__detail--full">
              <div className="inv__detailLabel">Motivo</div>
              <input
                className="inv__select"
                type="text"
                placeholder="Ej: Producto encontrado, dañado, conteo físico..."
                value={ajusteForm.motivo}
                onChange={(e) => setAjusteForm((v) => ({ ...v, motivo: e.target.value }))}
              />
            </div>

            <div className="inv__detail inv__detail--full">
              <div className="inv__detailLabel">Notas (opcional)</div>
              <textarea
                className="inv__select"
                rows={2}
                placeholder="Notas adicionales..."
                value={ajusteForm.notas}
                onChange={(e) => setAjusteForm((v) => ({ ...v, notas: e.target.value }))}
              />
            </div>
          </div>

          {ajusteError ? <div className="inv__detail inv__detail--full inv__state inv__state--error">{ajusteError}</div> : null}
        </div>
      </Modal>

      {/* ============ MODAL HISTORIAL ============ */}
      <Modal
        open={historyOpen}
        title={`Historial — ${historyTarget?.productoNombre ?? ""}`}
        onClose={closeHistory}
        footer={
          <div className="inv__modalActions">
            <SecondaryButton type="button" onClick={closeHistory}>
              Cerrar
            </SecondaryButton>
          </div>
        }
      >
        {loadingHistory ? (
          <div style={{ padding: "24px", textAlign: "center" }}>Cargando historial...</div>
        ) : historyMovimientos.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            No hay movimientos registrados para este producto.
          </div>
        ) : (
          <div className="inv__details">
            {historyMovimientos.map((m) => (
              <div key={m.id} className="inv__detail">
                <div className="inv__detailLabel">{formatDateTime(m.createdAt)}</div>
                <div className="inv__detailValue">
                  <strong>{m.tipo}</strong> — {m.motivo}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(245,245,245,0.55)" }}>
                  {m.cantidadAnterior} → {m.cantidadNueva} ({m.diferencia >= 0 ? "+" : ""}
                  {m.diferencia})
                  {m.usuarioUsername ? ` · por ${m.usuarioUsername}` : ""}
                </div>
                {m.notas ? (
                  <div style={{ fontSize: "12px", color: "rgba(245,245,245,0.5)", marginTop: "4px" }}>{m.notas}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
