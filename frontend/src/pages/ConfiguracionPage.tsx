import { useMemo, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import { getSettings, saveSettings, type ReceiptWidth, type Settings } from "../services/settingsStorage";
import "./ConfiguracionPage.css";

type SettingsFormState = {
	companyName: string;
	nit: string;
	address: string;
	city: string;
	phone: string;
	email: string;
	logoUrl: string;
	barcodeEnabled: boolean;
	currency: string;
	symbol: string;
	defaultMinStock: string;
	receiptWidth: ReceiptWidth;
	receiptBusinessName: string;
	receiptFooterMessage: string;
	internalNotes: string;
};

function toFormState(settings: Settings): SettingsFormState {
	return {
		companyName: settings.company.name,
		nit: settings.company.nit,
		address: settings.company.address,
		city: settings.company.city,
		phone: settings.company.phone,
		email: settings.company.email,
		logoUrl: settings.company.logoUrl,
		barcodeEnabled: settings.system.barcodeEnabled,
		currency: settings.system.currency,
		symbol: settings.system.symbol,
		defaultMinStock: String(settings.system.defaultMinStock),
		receiptWidth: settings.printing.receiptWidth,
		receiptBusinessName: settings.printing.receiptBusinessName,
		receiptFooterMessage: settings.printing.receiptFooterMessage,
		internalNotes: settings.additional.internalNotes
	};
}

function parseIntegerInput(value: string) {
	const normalized = value.replace(/[^\d-]/g, "");
	const n = Number(normalized);
	return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toSettings(form: SettingsFormState): Settings {
	return {
		company: {
			name: form.companyName.trim(),
			nit: form.nit.trim(),
			address: form.address.trim(),
			city: form.city.trim(),
			phone: form.phone.trim(),
			email: form.email.trim(),
			logoUrl: form.logoUrl.trim()
		},
		system: {
			barcodeEnabled: form.barcodeEnabled,
			currency: form.currency.trim(),
			symbol: form.symbol.trim(),
			defaultMinStock: parseIntegerInput(form.defaultMinStock)
		},
		printing: {
			receiptWidth: form.receiptWidth,
			receiptBusinessName: form.receiptBusinessName.trim(),
			receiptFooterMessage: form.receiptFooterMessage.trim()
		},
		additional: {
			internalNotes: form.internalNotes
		}
	};
}

function getDefaultSettings(): Settings {
	return {
		company: {
			name: "",
			nit: "",
			address: "",
			city: "",
			phone: "",
			email: "",
			logoUrl: ""
		},
		system: {
			barcodeEnabled: false,
			currency: "COP",
			symbol: "$",
			defaultMinStock: 5
		},
		printing: {
			receiptWidth: "58mm",
			receiptBusinessName: "",
			receiptFooterMessage: ""
		},
		additional: {
			internalNotes: ""
		}
	};
}

export default function ConfiguracionPage() {
	const initialSettings = useMemo(() => getSettings() ?? getDefaultSettings(), []);
	const initialRef = useRef<Settings>(initialSettings);
	const [form, setForm] = useState<SettingsFormState>(() => toFormState(initialSettings));

	const validations = useMemo(() => {
		const nameOk = form.companyName.trim().length > 0;
		const currencyOk = form.currency.trim().length > 0;
		const symbolOk = form.symbol.trim().length > 0;
		const minStockValue = parseIntegerInput(form.defaultMinStock);
		const minStockOk = minStockValue >= 0;
		return { nameOk, currencyOk, symbolOk, minStockOk, ok: nameOk && currencyOk && symbolOk && minStockOk };
	}, [form.companyName, form.currency, form.defaultMinStock, form.symbol]);

	const handleCancel = () => {
		setForm(toFormState(initialRef.current));
	};

	const handleSave = () => {
		if (!validations.ok) return;
		const settings = toSettings(form);
		saveSettings(settings);
		initialRef.current = settings;
		setForm(toFormState(settings));
	};

	return (
		<div className="set">
			<PageHeader
				title="Configuración"
				subtitle="Administra la información general de tu empresa y las preferencias del sistema."
			/>

			<div className="set__card">
				<div className="set__section">
					<div className="set__sectionTitle">1. Información de la empresa</div>
					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Nombre de la empresa</label>
							<input
								className="set__input"
								type="text"
								value={form.companyName}
								onChange={(e) => setForm((v) => ({ ...v, companyName: e.target.value }))}
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
								value={form.address}
								onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">Ciudad</label>
							<input className="set__input" type="text" value={form.city} onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))} />
						</div>
						<div className="set__field">
							<label className="set__label">Teléfono</label>
							<input className="set__input" type="text" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
						</div>
						<div className="set__field">
							<label className="set__label">Correo electrónico</label>
							<input className="set__input" type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
						</div>
						<div className="set__field set__field--full">
							<label className="set__label">Logo (URL)</label>
							<input
								className="set__input"
								type="text"
								placeholder="https://..."
								value={form.logoUrl}
								onChange={(e) => setForm((v) => ({ ...v, logoUrl: e.target.value }))}
							/>
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle">2. Configuración del sistema</div>

					<div className="set__row">
						<div>
							<div className="set__rowLabel">Activar código de barras</div>
							<div className="set__rowHint">Si está desactivado, el ERP ocultará esa funcionalidad.</div>
						</div>
						<button
							type="button"
							className={["set__toggle", form.barcodeEnabled ? "set__toggle--on" : ""].join(" ")}
							onClick={() => setForm((v) => ({ ...v, barcodeEnabled: !v.barcodeEnabled }))}
							aria-label="Activar código de barras"
						>
							<span className="set__toggleKnob" aria-hidden="true" />
						</button>
					</div>

					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Moneda</label>
							<input
								className="set__input"
								type="text"
								value={form.currency}
								onChange={(e) => setForm((v) => ({ ...v, currency: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">Símbolo</label>
							<input
								className="set__input"
								type="text"
								value={form.symbol}
								onChange={(e) => setForm((v) => ({ ...v, symbol: e.target.value }))}
							/>
						</div>
						<div className="set__field">
							<label className="set__label">Stock mínimo por defecto</label>
							<input
								className="set__input"
								type="text"
								inputMode="numeric"
								value={form.defaultMinStock}
								onChange={(e) => setForm((v) => ({ ...v, defaultMinStock: e.target.value }))}
							/>
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle">3. Impresión</div>
					<div className="set__grid">
						<div className="set__field">
							<label className="set__label">Ancho del recibo</label>
							<select
								className="set__select"
								value={form.receiptWidth}
								onChange={(e) => setForm((v) => ({ ...v, receiptWidth: e.target.value as ReceiptWidth }))}
							>
								<option value="58mm">58 mm</option>
								<option value="80mm">80 mm</option>
							</select>
						</div>
						<div className="set__field">
							<label className="set__label">Nombre del negocio en el recibo</label>
							<input
								className="set__input"
								type="text"
								value={form.receiptBusinessName}
								onChange={(e) => setForm((v) => ({ ...v, receiptBusinessName: e.target.value }))}
							/>
						</div>
						<div className="set__field set__field--full">
							<label className="set__label">Mensaje al pie del recibo</label>
							<input
								className="set__input"
								type="text"
								value={form.receiptFooterMessage}
								onChange={(e) => setForm((v) => ({ ...v, receiptFooterMessage: e.target.value }))}
							/>
						</div>
					</div>
				</div>

				<div className="set__section">
					<div className="set__sectionTitle">4. Información adicional</div>
					<div className="set__grid">
						<div className="set__field set__field--full">
							<label className="set__label">Notas internas</label>
							<textarea
								className="set__textarea"
								rows={4}
								value={form.internalNotes}
								onChange={(e) => setForm((v) => ({ ...v, internalNotes: e.target.value }))}
							/>
						</div>
					</div>
				</div>

				<div className="set__actions">
					<SecondaryButton type="button" onClick={handleCancel}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="button" onClick={handleSave} disabled={!validations.ok}>
						Guardar Configuración
					</PrimaryButton>
				</div>
			</div>
		</div>
	);
}

