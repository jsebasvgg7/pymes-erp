import { useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import { addProvider, getProviders, updateProvider, type CreateProviderInput, type Provider } from "../services/providerStorage";
import "./ProveedoresPage.css";

type ProveedorModalMode = "create" | "edit";

export default function ProveedoresPage() {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<ProveedorModalMode>("create");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmProviderId, setConfirmProviderId] = useState<string | null>(null);

	const [proveedores, setProveedores] = useState<Provider[]>(() => getProviders());
	const [form, setForm] = useState<CreateProviderInput>({
		empresa: "",
		nit: "",
		contacto: "",
		telefono: "",
		correo: "",
		direccion: "",
		estado: "Activo"
	});

	const providerById = useMemo(() => {
		const map = new Map<string, Provider>();
		proveedores.forEach((p) => map.set(p.id, p));
		return map;
	}, [proveedores]);

	const columns: Array<DataTableColumn<Provider>> = useMemo(
		() => [
			{ key: "empresa", header: "Empresa", render: (r) => r.empresa },
			{ key: "nit", header: "NIT", render: (r) => r.nit },
			{ key: "contacto", header: "Contacto", render: (r) => r.contacto },
			{ key: "telefono", header: "Teléfono", render: (r) => r.telefono },
			{ key: "correo", header: "Correo", render: (r) => r.correo },
			{ key: "estado", header: "Estado", render: (r) => <StatusBadge status={r.estado} /> },
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: (r) => (
					<div className="prov__actions">
						<SecondaryButton
							type="button"
							className="prov__actionBtn"
							onClick={() => {
								setModalMode("edit");
								setEditingId(r.id);
								setForm({
									empresa: r.empresa,
									nit: r.nit,
									contacto: r.contacto,
									telefono: r.telefono,
									correo: r.correo,
									direccion: r.direccion,
									estado: r.estado
								});
								setModalOpen(true);
							}}
						>
							Editar
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className={["prov__actionBtn", r.estado === "Activo" ? "prov__actionBtn--danger" : ""].join(" ")}
							onClick={() => {
								setConfirmProviderId(r.id);
								setConfirmOpen(true);
							}}
						>
							{r.estado === "Activo" ? "Desactivar" : "Activar"}
						</SecondaryButton>
					</div>
				)
			}
		],
		[]
	);

	return (
		<div className="prov">
			<PageHeader
				title="Proveedores"
				subtitle="Administración de proveedores registrados."
				actions={
					<PrimaryButton
						type="button"
						onClick={() => {
							setModalMode("create");
							setEditingId(null);
							setForm({
								empresa: "",
								nit: "",
								contacto: "",
								telefono: "",
								correo: "",
								direccion: "",
								estado: "Activo"
							});
							setModalOpen(true);
						}}
					>
						Nuevo Proveedor
					</PrimaryButton>
				}
			/>

			<div className="prov__controls">
				<div className="prov__search">
					<SearchBar placeholder="Buscar proveedor..." />
				</div>
				<div className="prov__filters" aria-label="Filtro visual">
					<SecondaryButton type="button" className="prov__filterBtn prov__filterBtn--active">
						Todos
					</SecondaryButton>
					<SecondaryButton type="button" className="prov__filterBtn">
						Activos
					</SecondaryButton>
					<SecondaryButton type="button" className="prov__filterBtn">
						Inactivos
					</SecondaryButton>
				</div>
			</div>

			<div className="prov__table">
				<DataTable columns={columns} data={proveedores} emptyState="No hay proveedores." />
			</div>

			<Modal
				open={modalOpen}
				title={modalMode === "create" ? "Nuevo Proveedor" : "Editar Proveedor"}
				onClose={() => setModalOpen(false)}
				footer={
					<div className="prov__modalActions">
						<SecondaryButton type="button" onClick={() => setModalOpen(false)}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton
							type="button"
							onClick={() => {
								if (modalMode === "create") {
									addProvider(form);
									setProveedores(getProviders());
									setModalOpen(false);
									return;
								}

								if (!editingId) return;
								updateProvider(editingId, form);
								setProveedores(getProviders());
								setModalOpen(false);
							}}
						>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				<form className="prov__form" onSubmit={(e) => e.preventDefault()}>
					<div className="prov__grid">
						<div className="prov__field">
							<label className="prov__label">Empresa</label>
							<input
								className="prov__input"
								type="text"
								placeholder="Nombre de la empresa"
								value={form.empresa}
								onChange={(e) => setForm((prev) => ({ ...prev, empresa: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">NIT</label>
							<input
								className="prov__input"
								type="text"
								placeholder="NIT"
								value={form.nit}
								onChange={(e) => setForm((prev) => ({ ...prev, nit: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Contacto</label>
							<input
								className="prov__input"
								type="text"
								placeholder="Nombre del contacto"
								value={form.contacto}
								onChange={(e) => setForm((prev) => ({ ...prev, contacto: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Teléfono</label>
							<input
								className="prov__input"
								type="text"
								placeholder="+57 ..."
								value={form.telefono}
								onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Correo</label>
							<input
								className="prov__input"
								type="email"
								placeholder="correo@proveedor.com"
								value={form.correo}
								onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
							/>
						</div>
						<div className="prov__field prov__field--full">
							<label className="prov__label">Dirección</label>
							<input
								className="prov__input"
								type="text"
								placeholder="Dirección"
								value={form.direccion}
								onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
							/>
						</div>
						<div className="prov__field">
							<label className="prov__label">Estado</label>
							<select
								className="prov__select"
								value={form.estado}
								onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value === "Inactivo" ? "Inactivo" : "Activo" }))}
							>
								<option value="Activo">Activo</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title={(confirmProviderId && providerById.get(confirmProviderId)?.estado === "Activo") ? "Desactivar proveedor" : "Activar proveedor"}
				message={(confirmProviderId && providerById.get(confirmProviderId)?.estado === "Activo") ? "¿Deseas desactivar este proveedor?" : "¿Deseas volver a activar este proveedor?"}
				confirmText={(confirmProviderId && providerById.get(confirmProviderId)?.estado === "Activo") ? "Desactivar" : "Activar"}
				cancelText="Cancelar"
				onConfirm={() => {
					if (!confirmProviderId) return;
					const current = providerById.get(confirmProviderId);
					if (!current) return;
					updateProvider(confirmProviderId, { estado: current.estado === "Activo" ? "Inactivo" : "Activo" });
					setProveedores(getProviders());
					setConfirmProviderId(null);
					setConfirmOpen(false);
				}}
				onCancel={() => {
					setConfirmProviderId(null);
					setConfirmOpen(false);
				}}
			/>
		</div>
	);
}

