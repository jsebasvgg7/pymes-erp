import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { authService } from "../services/authService";
import { empresaService, type Empresa } from "../services/empresaService";
import "./ConfiguracionPage.css";

type SettingsFormState = {
	nombre: string;
	nit: string;
	direccion: string;
	telefono: string;
	email: string;
};

function toFormState(empresa: Empresa): SettingsFormState {
	return {
		nombre: empresa.nombre ?? "",
		nit: empresa.nit ?? "",
		direccion: empresa.direccion ?? "",
		telefono: empresa.telefono ?? "",
		email: empresa.email ?? ""
	};
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

export default function ConfiguracionPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const initialRef = useRef<SettingsFormState | null>(null);
	const [form, setForm] = useState<SettingsFormState>({ nombre: "", nit: "", direccion: "", telefono: "", email: "" });

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError("No se encontró la empresa del usuario. Inicia sesión nuevamente.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const empresa = await empresaService.obtenerPorId(empresaId);
			const state = toFormState(empresa);
			initialRef.current = state;
			setForm(state);
		} catch {
			setError("No se pudo cargar la información de la empresa. Verifica tu conexión con el servidor.");
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const validations = useMemo(() => {
		const nombreOk = form.nombre.trim().length > 0;
		return { nombreOk, ok: nombreOk };
	}, [form.nombre]);

	const handleCancel = () => {
		if (initialRef.current) {
			setForm(initialRef.current);
		}
		setSaveError(null);
		setSaveSuccess(false);
	};

	const handleSave = async () => {
		if (!validations.ok || !empresaId) return;

		setSaving(true);
		setSaveError(null);
		setSaveSuccess(false);
		try {
			const updated = await empresaService.actualizar(empresaId, {
				nombre: form.nombre.trim(),
				nit: form.nit.trim(),
				direccion: form.direccion.trim(),
				telefono: form.telefono.trim(),
				email: form.email.trim()
			});
			const state = toFormState(updated);
			initialRef.current = state;
			setForm(state);
			setSaveSuccess(true);
		} catch (err) {
			setSaveError(extractErrorMessage(err, "No se pudo guardar la configuración. Intenta nuevamente."));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="set">
				<LoadingState label="Cargando configuración..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="set">
				<div className="set__state set__state--error">{error}</div>
			</div>
		);
	}

	return (
		<div className="set">
			<PageHeader
				title="Configuración"
				subtitle="Administra la información general de tu empresa y las preferencias del sistema."
			/>

			<div className="set__card">
				{saveError ? <div className="set__formError">{saveError}</div> : null}
				{saveSuccess ? <div className="set__formSuccess">Configuración guardada correctamente.</div> : null}

				<div className="set__section">
					<div className="set__sectionTitle">1. Información de la empresa</div>
					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Nombre de la empresa *</label>
							<input
								className="set__input"
								type="text"
								value={form.nombre}
								onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">NIT</label>
							<input className="set__input" type="text" value={form.nit} onChange={(e) => setForm((v) => ({ ...v, nit: e.target.value }))} />
						</div>
						<div className="set__field set__field--full">
							<label className="set__label">Dirección</label>
							<input
								className="set__input"
								type="text"
								value={form.direccion}
								onChange={(e) => setForm((v) => ({ ...v, direccion: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">Teléfono</label>
							<input
								className="set__input"
								type="text"
								value={form.telefono}
								onChange={(e) => setForm((v) => ({ ...v, telefono: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">Correo electrónico</label>
							<input
								className="set__input"
								type="email"
								value={form.email}
								onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
							/>
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle set__sectionTitle--soon">
						2. Configuración del sistema <StatusBadge status="Pendiente" />
					</div>
					<div className="set__soonHint">Estos ajustes todavía no tienen soporte en el backend. Próximamente podrás configurarlos aquí.</div>

					<div className="set__row set__row--disabled">
						<div>
							<div className="set__rowLabel">Activar código de barras</div>
							<div className="set__rowHint">Si está desactivado, el ERP ocultará esa funcionalidad.</div>
						</div>
						<button type="button" className="set__toggle" disabled aria-label="Activar código de barras (no disponible)">
							<span className="set__toggleKnob" aria-hidden="true" />
						</button>
					</div>

					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Moneda</label>
							<input className="set__input" type="text" value="COP" disabled />
						</div>
						<div className="set__field">
							<label className="set__label">Símbolo</label>
							<input className="set__input" type="text" value="$" disabled />
						</div>
						<div className="set__field">
							<label className="set__label">Stock mínimo por defecto</label>
							<input className="set__input" type="text" value="Configurable por producto" disabled />
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle set__sectionTitle--soon">
						3. Impresión <StatusBadge status="Pendiente" />
					</div>
					<div className="set__soonHint">Estos ajustes todavía no tienen soporte en el backend. Próximamente podrás configurarlos aquí.</div>

					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Ancho del recibo</label>
							<select className="set__select" value="58mm" disabled>
								<option value="58mm">58 mm</option>
							</select>
						</div>
						<div className="set__field">
							<label className="set__label">Nombre del negocio en el recibo</label>
							<input className="set__input" type="text" value="" disabled placeholder="No disponible todavía" />
						</div>
						<div className="set__field set__field--full">
							<label className="set__label">Mensaje al pie del recibo</label>
							<input className="set__input" type="text" value="" disabled placeholder="No disponible todavía" />
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle set__sectionTitle--soon">
						4. Información adicional <StatusBadge status="Pendiente" />
					</div>
					<div className="set__soonHint">Estos ajustes todavía no tienen soporte en el backend. Próximamente podrás configurarlos aquí.</div>
					<div className="set__grid">
						<div className="set__field set__field--full">
							<label className="set__label">Notas internas</label>
							<textarea className="set__textarea" rows={4} value="" disabled placeholder="No disponible todavía" />
						</div>
					</div>
				</div>

				<div className="set__actions">
					<SecondaryButton type="button" onClick={handleCancel} disabled={saving}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="button" onClick={handleSave} disabled={!validations.ok || saving}>
						{saving ? "Guardando..." : "Guardar Configuración"}
					</PrimaryButton>
				</div>
			</div>
		</div>
	);
}