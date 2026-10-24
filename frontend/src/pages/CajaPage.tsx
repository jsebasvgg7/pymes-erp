import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, TrendingDown, TrendingUp, Wallet, Plus, ArrowLeftRight } from "lucide-react";
import DataTable, { DataTableLayout } from "../components/DataTable";
import { formatDateShort } from "../utils/formatDate";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { formaPagoService, type FormaPago } from "../services/formaPagoService";
import { cajaService, type AperturaCaja, type CajaResumen, type MovimientoCajaResponse } from "../services/cajaService";
import AperturaCajaControl from "../components/AperturaCajaControl";
import { useEstadoCaja } from "../hooks/useEstadoCaja";
import { useAccionRapida } from "../hooks/useAccionRapida";
import { formatoMoneda } from "../utils/montoCaja";
import "./CajaPage.css";

type CashFormState = {
    tipo: "INGRESO" | "EGRESO";
    formaPagoId: string;
    descripcion: string;
    monto: string;
};

const defaultFormState: CashFormState = {
    tipo: "INGRESO",
    formaPagoId: "",
    descripcion: "",
    monto: ""
};

type NewCajaFormState = {
    nombre: string;
    saldoInicial: string;
};

const defaultNewCajaForm: NewCajaFormState = {
    nombre: "",
    saldoInicial: ""
};

function formatCurrency(value: number) {
    return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
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

export default function CajaPage() {
    const empresaId = authService.getUsuario()?.empresaId;

    const [cajas, setCajas] = useState<CajaResumen[]>([]);
    const [cajaId, setCajaId] = useState<number | null>(null);
    const [movimientos, setMovimientos] = useState<MovimientoCajaResponse[]>([]);
    const [cierres, setCierres] = useState<AperturaCaja[]>([]);
    const { estados: estadosCaja } = useEstadoCaja(empresaId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ErrorPagina | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<CashFormState>(defaultFormState);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

    const [newCajaModalOpen, setNewCajaModalOpen] = useState(false);
    const [newCajaForm, setNewCajaForm] = useState<NewCajaFormState>(defaultNewCajaForm);
    const [creatingCaja, setCreatingCaja] = useState(false);
    const [newCajaError, setNewCajaError] = useState<string | null>(null);

    const loadCajas = useCallback(async (isSilent = false) => {
        if (!empresaId) {
            setError(errorSesion("caja"));
            setLoading(false);
            return;
        }

        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const data = await cajaService.obtenerResumenTodas(empresaId);
            const safeData = Array.isArray(data) ? data : [];
            setCajas(safeData);
            setCajaId((prev) => prev ?? safeData[0]?.cajaId ?? null);
        } catch (err) {
            console.error("Error al cargar cajas:", err);
            setError(describirError("caja", err));
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    const loadMovimientos = useCallback(async () => {
        if (!cajaId) {
            setMovimientos([]);
            return;
        }

        try {
            const data = await cajaService.listarMovimientosPorCaja(cajaId);
            const safeData = Array.isArray(data?.content) ? data.content : [];
            setMovimientos(safeData);
        } catch (err) {
            console.error("Error al cargar movimientos:", err);
            setError(describirError("caja", err));
        }
    }, [cajaId]);

    const loadCierres = useCallback(async () => {
        if (!cajaId) {
            setCierres([]);
            return;
        }

        try {
            const data = await cajaService.listarCierres(cajaId);
            setCierres(Array.isArray(data?.content) ? data.content : []);
        } catch (err) {
            console.error("Error al cargar cierres:", err);
            setCierres([]);
        }
    }, [cajaId]);

    useEffect(() => {
        loadCajas();
    }, [loadCajas]);

    useEffect(() => {
        loadCierres();
    }, [loadCierres]);

    useEffect(() => {
        loadMovimientos();
    }, [loadMovimientos]);

    useEffect(() => {
        if (!empresaId) return;
        formaPagoService
            .listarPorEmpresa(empresaId, 0, 50)
            .then((d) => setFormasPago(d.content.filter((f) => f.active && f.tipo !== "CREDITO")))
            .catch(() => setFormasPago([]));
    }, [empresaId]);

    const cajaActual = useMemo(() => cajas.find((c) => c.cajaId === cajaId) ?? null, [cajas, cajaId]);
    const estadoCajaActual = useMemo(() => estadosCaja.find((e) => e.cajaId === cajaId) ?? null, [estadosCaja, cajaId]);

    const openModal = useCallback(() => {
        setForm(defaultFormState);
        setFormError(null);
        setModalOpen(true);
    }, []);

    useAccionRapida("movimiento", openModal);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setFormError(null);
    }, []);

    const isValid = useMemo(() => {
        const descripcionOk = form.descripcion.trim().length > 0;
        const monto = parseDecimalInput(form.monto);
        return descripcionOk && monto > 0 && form.formaPagoId !== "";
    }, [form.descripcion, form.monto, form.formaPagoId]);

    const handleSave = useCallback(async () => {
        if (!isValid || !empresaId || !cajaId) return;

        setSaving(true);
        setFormError(null);
        try {
            await cajaService.registrarMovimiento({
                empresaId,
                cajaId,
                formaPagoId: Number(form.formaPagoId),
                tipo: form.tipo,
                monto: parseDecimalInput(form.monto),
                descripcion: form.descripcion.trim()
            });

            await Promise.all([loadCajas(true), loadMovimientos()]);
            closeModal();
        } catch (err) {
            setFormError(extractErrorMessage(err, "No se pudo registrar el movimiento. Intenta nuevamente."));
        } finally {
            setSaving(false);
        }
    }, [cajaId, closeModal, empresaId, form.descripcion, form.formaPagoId, form.monto, form.tipo, isValid, loadCajas, loadMovimientos]);

    const openNewCajaModal = useCallback(() => {
        setNewCajaForm(defaultNewCajaForm);
        setNewCajaError(null);
        setNewCajaModalOpen(true);
    }, []);

    useAccionRapida("nueva-caja", openNewCajaModal);

    const closeNewCajaModal = useCallback(() => {
        setNewCajaModalOpen(false);
        setNewCajaError(null);
    }, []);

    const isNewCajaValid = useMemo(() => newCajaForm.nombre.trim().length > 0, [newCajaForm.nombre]);

    const handleCreateCaja = useCallback(async () => {
        if (!isNewCajaValid || !empresaId) return;

        setCreatingCaja(true);
        setNewCajaError(null);
        try {
            const saldoInicial = newCajaForm.saldoInicial.trim() ? parseDecimalInput(newCajaForm.saldoInicial) : undefined;
            await cajaService.crear({
                empresaId,
                nombre: newCajaForm.nombre.trim(),
                saldoInicial
            });

            await loadCajas();
            closeNewCajaModal();
        } catch (err) {
            setNewCajaError(extractErrorMessage(err, "No se pudo crear la caja. Intenta nuevamente."));
        } finally {
            setCreatingCaja(false);
        }
    }, [closeNewCajaModal, empresaId, isNewCajaValid, loadCajas, newCajaForm.nombre, newCajaForm.saldoInicial]);

    const movimientosLayout: DataTableLayout<MovimientoCajaResponse> = {
        principal: (r) => r.descripcion || "Sin concepto",
        secundario: (r) => formatDateShort(r.fecha),
        etiquetas: (r) => (r.formaPagoNombre ? <span className="ui-list__chip">{r.formaPagoNombre}</span> : null),
        estado: (r) => <StatusBadge status={r.tipo === "INGRESO" ? "Ingreso" : "Egreso"} />,
        valor: (r) => `${r.tipo === "INGRESO" ? "+" : "−"} ${formatCurrency(r.monto)}`
    };

    const cierresLayout: DataTableLayout<AperturaCaja> = {
        principal: (r) => (r.fechaCierre ? formatDateShort(r.fechaCierre) : "Sin fecha"),
        secundario: (r) =>
            r.tipoCierre === "AUTOMATICO"
                ? `Cierre automático · Esperado ${formatoMoneda(r.efectivoEsperado)}`
                : `${r.usuarioCierreNombre ?? "Usuario"} · Esperado ${formatoMoneda(r.efectivoEsperado)} · Contado ${formatoMoneda(r.efectivoContado)}`,
        etiquetas: (r) => <span className="ui-list__chip">{r.tipoCierre === "AUTOMATICO" ? "Sin conteo" : "Manual"}</span>,
        estado: (r) =>
            r.resultado ? (
                <span className={`apc__chip apc__chip--${r.resultado.toLowerCase()}`}>
                    {r.resultado === "CUADRADA" ? "Cuadrada" : r.resultado === "FALTANTE" ? "Faltante" : "Sobrante"}
                </span>
            ) : null,
        valor: (r) => (r.diferencia === null ? "—" : `${r.diferencia > 0 ? "+" : r.diferencia < 0 ? "−" : ""} ${formatoMoneda(Math.abs(r.diferencia))}`)
    };

    if (loading) {
        return (
            <div className="cash">
                <LoadingState label="Cargando caja..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="cash">
                <ErrorState pagina="caja" error={error} onRetry={() => loadCajas()} />
            </div>
        );
    }

    if (cajas.length === 0) {
        return (
            <div className="cash">
                <PageHeader
                    title="Control de efectivo"
                    subtitle="Registra ingresos y egresos y consulta el saldo de tus cajas."
                    actions={
                        <PrimaryButton type="button" onClick={openNewCajaModal}>
                            <Plus size={14} strokeWidth={2.2} />
                            <span>Nueva caja</span>
                        </PrimaryButton>
                    }
                />
                <div className="cash__empty cash__empty--page">
                    <div className="cash__emptyTitle">No hay ninguna caja registrada para esta empresa.</div>
                    <div className="cash__emptySubtitle">
                        Se necesita al menos una caja activa antes de poder registrar movimientos, ventas o compras. Crea la primera
                        caja para empezar.
                    </div>
                </div>

                <Modal
                    open={newCajaModalOpen}
                    title="Nueva caja"
                    subtitle="Crea una caja para registrar los movimientos de dinero."
                    icon={<Wallet size={20} strokeWidth={2} />}
                    onClose={closeNewCajaModal}
                    footer={
                        <div className="cash__modalActions">
                            <SecondaryButton type="button" onClick={closeNewCajaModal} disabled={creatingCaja}>
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton type="button" onClick={handleCreateCaja} disabled={!isNewCajaValid || creatingCaja}>
                                {creatingCaja ? "Creando..." : "Crear Caja"}
                            </PrimaryButton>
                        </div>
                    }
                >
                    <form className="cash__form" onSubmit={(e) => e.preventDefault()}>
                        <div className="cash__grid">
                            <div className="cash__field cash__field--full">
                                <label className="cash__label">Nombre</label>
                                <input
                                    className="cash__input"
                                    type="text"
                                    placeholder="Ej: Caja Principal"
                                    value={newCajaForm.nombre}
                                    onChange={(e) => setNewCajaForm((v) => ({ ...v, nombre: e.target.value }))}
                                />
                            </div>

                            <div className="cash__field cash__field--full">
                                <label className="cash__label">Saldo inicial (opcional)</label>
                                <input
                                    className="cash__input"
                                    type="text"
                                    placeholder="$0"
                                    inputMode="decimal"
                                    value={newCajaForm.saldoInicial}
                                    onChange={(e) => setNewCajaForm((v) => ({ ...v, saldoInicial: e.target.value }))}
                                />
                            </div>

                            {newCajaError ? <div className="cash__field cash__field--full cash__formError">{newCajaError}</div> : null}
                        </div>
                    </form>
                </Modal>
            </div>
        );
    }

    return (
        <div className="cash">
            <PageHeader
                title="Control de efectivo"
                subtitle="Registra ingresos y egresos y consulta el saldo de tus cajas."
                actions={
                    <>
                        <AperturaCajaControl estado={estadoCajaActual} ultimoCierre={cierres[0] ?? null} onChange={loadCierres} />
                        <SecondaryButton type="button" onClick={openNewCajaModal}>
                            <Wallet size={14} strokeWidth={2} />
                            <span>Nueva caja</span>
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={openModal} disabled={estadoCajaActual !== null && !estadoCajaActual.abierta}>
                            <Plus size={14} strokeWidth={2.2} />
                            <span>Nuevo movimiento</span>
                        </PrimaryButton>
                    </>
                }
            />

            {cajas.length > 1 ? (
                <div className="cash__controls">
                    <div className="cash__field">
                        <label className="cash__label">Caja</label>
                        <select
                            className="cash__select"
                            value={cajaId ?? ""}
                            onChange={(e) => setCajaId(Number(e.target.value))}
                        >
                            {cajas.map((c) => (
                                <option key={c.cajaId} value={c.cajaId}>
                                    {c.cajaNombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : null}

            <section className="cash__metrics" aria-label="Resumen">
                <StatCard
                    icon={<Wallet size={20} strokeWidth={1.8} />}
                    title="Saldo Actual"
                    value={formatCurrency(cajaActual?.saldoActual ?? 0)}
                    color="blue"
                    footnote={cajaActual?.cajaNombre}
                />
                <StatCard
                    icon={<TrendingUp size={20} strokeWidth={1.8} />}
                    title="Total ingresos"
                    value={formatCurrency(cajaActual?.totalIngresos ?? 0)}
                    color="green"
                    footnote="Histórico de la caja"
                />
                <StatCard
                    icon={<TrendingDown size={20} strokeWidth={1.8} />}
                    title="Total egresos"
                    value={formatCurrency(cajaActual?.totalEgresos ?? 0)}
                    color="red"
                    footnote="Histórico de la caja"
                />
                <StatCard
                    icon={<Receipt size={20} strokeWidth={1.8} />}
                    title="Movimientos registrados"
                    value={(cajaActual?.totalMovimientos ?? 0).toLocaleString("es-CO")}
                    color="amber"
                    footnote="Total"
                />
            </section>

            <div className="cash__table">
                <DataTable
                    title="Movimientos"
                    layout={movimientosLayout}
                    data={movimientos}
                    pageSize={10}
                    emptyState={
                        <div className="cash__empty">
                            <div className="cash__emptyTitle">No existen movimientos registrados.</div>
                            <div className="cash__emptySubtitle">Registra el primer movimiento para comenzar el control de caja.</div>
                        </div>
                    }
                />
            </div>

            <div className="cash__table">
                <DataTable
                    title="Historial de cierres"
                    layout={cierresLayout}
                    data={cierres}
                    pageSize={10}
                    emptyState={
                        <div className="cash__empty">
                            <div className="cash__emptyTitle">Aún no hay cierres registrados.</div>
                            <div className="cash__emptySubtitle">Cada vez que cierres la caja quedará aquí con su resultado.</div>
                        </div>
                    }
                />
            </div>

            <Modal
                open={modalOpen}
                title="Nuevo movimiento"
                subtitle="Registra un ingreso o egreso en la caja."
                icon={<ArrowLeftRight size={20} strokeWidth={2} />}
                onClose={closeModal}
                footer={
                    <div className="cash__modalActions">
                        <SecondaryButton type="button" onClick={closeModal} disabled={saving}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={handleSave} disabled={!isValid || saving}>
                            {saving ? "Guardando..." : "Guardar"}
                        </PrimaryButton>
                    </div>
                }
            >
                <form className="cash__form" onSubmit={(e) => e.preventDefault()}>
                    <div className="cash__grid">
                        <div className="cash__field">
                            <label className="cash__label">Tipo</label>
                            <select
                                className="cash__select"
                                value={form.tipo}
                                onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value as "INGRESO" | "EGRESO" }))}
                            >
                                <option value="INGRESO">Ingreso</option>
                                <option value="EGRESO">Egreso</option>
                            </select>
                        </div>

                        <div className="cash__field">
                            <label className="cash__label">Valor</label>
                            <input
                                className="cash__input"
                                type="text"
                                placeholder="$0"
                                inputMode="decimal"
                                value={form.monto}
                                onChange={(e) => setForm((v) => ({ ...v, monto: e.target.value }))}
                            />
                        </div>

                        <div className="cash__field cash__field--full">
                            <label className="cash__label">Forma de pago</label>
                            <select
                                className="cash__select"
                                value={form.formaPagoId}
                                onChange={(e) => setForm((v) => ({ ...v, formaPagoId: e.target.value }))}
                            >
                                <option value="">Selecciona una forma de pago</option>
                                {formasPago.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="cash__field cash__field--full">
                            <label className="cash__label">Concepto</label>
                            <input
                                className="cash__input"
                                type="text"
                                placeholder="Ej: Pago de servicios"
                                value={form.descripcion}
                                onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
                            />
                        </div>

                        {formError ? <div className="cash__field cash__field--full cash__formError">{formError}</div> : null}
                    </div>
                </form>
            </Modal>

            <Modal
                open={newCajaModalOpen}
                title="Nueva caja"
                subtitle="Crea una caja para registrar los movimientos de dinero."
                icon={<Wallet size={20} strokeWidth={2} />}
                onClose={closeNewCajaModal}
                footer={
                    <div className="cash__modalActions">
                        <SecondaryButton type="button" onClick={closeNewCajaModal} disabled={creatingCaja}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={handleCreateCaja} disabled={!isNewCajaValid || creatingCaja}>
                            {creatingCaja ? "Creando..." : "Crear Caja"}
                        </PrimaryButton>
                    </div>
                }
            >
                <form className="cash__form" onSubmit={(e) => e.preventDefault()}>
                    <div className="cash__grid">
                        <div className="cash__field cash__field--full">
                            <label className="cash__label">Nombre</label>
                            <input
                                className="cash__input"
                                type="text"
                                placeholder="Ej: Caja Principal"
                                value={newCajaForm.nombre}
                                onChange={(e) => setNewCajaForm((v) => ({ ...v, nombre: e.target.value }))}
                            />
                        </div>

                        <div className="cash__field cash__field--full">
                            <label className="cash__label">Saldo inicial (opcional)</label>
                            <input
                                className="cash__input"
                                type="text"
                                placeholder="$0"
                                inputMode="decimal"
                                value={newCajaForm.saldoInicial}
                                onChange={(e) => setNewCajaForm((v) => ({ ...v, saldoInicial: e.target.value }))}
                            />
                        </div>

                        {newCajaError ? <div className="cash__field cash__field--full cash__formError">{newCajaError}</div> : null}
                    </div>
                </form>
            </Modal>
        </div>
    );
}
