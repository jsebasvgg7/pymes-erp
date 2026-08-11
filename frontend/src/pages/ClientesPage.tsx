import { useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable, { DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import SearchBar from "../components/SearchBar";
import SecondaryButton from "../components/SecondaryButton";
import StatusBadge from "../components/StatusBadge";
import "./ClientesPage.css";

type ClienteEstado = "Activo" | "Inactivo";

type ClienteRow = {
	id: string;
	nombre: string;
	documento: string;
	telefono: string;
	correo: string;
	estado: ClienteEstado;
	direccion: string;
};

type ClienteModalMode = "create" | "edit";

export default function ClientesPage() {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<ClienteModalMode>("create");
	const [confirmOpen, setConfirmOpen] = useState(false);

	const clientes: ClienteRow[] = useMemo(
		() => [
			{
				id: "1",
				nombre: "Comercial Andina",
				documento: "900123456-7",
				telefono: "+57 310 555 0101",
				correo: "contacto@andina.com",
				estado: "Activo",
				direccion: "Cra 10 # 20-30"
			},
			{
				id: "2",
				nombre: "Soluciones Norte SAS",
				documento: "901234567-8",
				telefono: "+57 300 222 3344",
				correo: "ventas@solnorte.co",
				estado: "Activo",
				direccion: "Av 5 # 12-18"
			},
			{
				id: "3",
				nombre: "Ferretería Central",
				documento: "1020304050",
				telefono: "+57 312 444 8899",
				correo: "central@ferreteria.com",
				estado: "Activo",
				direccion: "Cl 45 # 8-20"
			},
			{
				id: "4",
				nombre: "Distribuciones Pacífico",
				documento: "900987654-1",
				telefono: "+57 315 100 2030",
				correo: "info@dpacifico.co",
				estado: "Inactivo",
				direccion: "Cl 13 # 55-10"
			},
			{
				id: "5",
				nombre: "Servicios Contables Rivera",
				documento: "79900211",
				telefono: "+57 301 777 1212",
				correo: "rivera@servicios.co",
				estado: "Activo",
				direccion: "Cra 22 # 14-05"
			},
			{
				id: "6",
				nombre: "Restaurante La Plaza",
				documento: "901112223-4",
				telefono: "+57 316 333 4455",
				correo: "admin@laplaza.com",
				estado: "Activo",
				direccion: "Cl 7 # 9-01"
			},
			{
				id: "7",
				nombre: "Tienda San Martín",
				documento: "1030405060",
				telefono: "+57 320 111 2233",
				correo: "sanmartin@tienda.co",
				estado: "Inactivo",
				direccion: "Cra 3 # 18-40"
			},
			{
				id: "8",
				nombre: "Importadora Horizonte",
				documento: "900456789-2",
				telefono: "+57 319 555 6677",
				correo: "hola@horizonte.com",
				estado: "Activo",
				direccion: "Av 30 # 60-22"
			},
			{
				id: "9",
				nombre: "Clínica Santa Fe",
				documento: "901998877-6",
				telefono: "+57 318 909 8080",
				correo: "facturacion@clinicasf.co",
				estado: "Activo",
				direccion: "Cl 90 # 15-20"
			},
			{
				id: "10",
				nombre: "Constructora Delta",
				documento: "900112233-0",
				telefono: "+57 317 600 7000",
				correo: "delta@constructora.co",
				estado: "Activo",
				direccion: "Cra 50 # 26-14"
			},
			{
				id: "11",
				nombre: "Tecnología & Datos",
				documento: "901223344-5",
				telefono: "+57 305 222 1111",
				correo: "soporte@tyd.co",
				estado: "Activo",
				direccion: "Cl 12 # 34-56"
			},
			{
				id: "12",
				nombre: "Panadería El Trigal",
				documento: "1002003004",
				telefono: "+57 302 555 9090",
				correo: "eltrigal@panaderia.co",
				estado: "Inactivo",
				direccion: "Cl 19 # 10-02"
			}
		],
		[]
	);

	const columns: Array<DataTableColumn<ClienteRow>> = useMemo(
		() => [
			{ key: "nombre", header: "Nombre", render: (r) => r.nombre },
			{ key: "documento", header: "Documento", render: (r) => r.documento },
			{ key: "telefono", header: "Teléfono", render: (r) => r.telefono },
			{ key: "correo", header: "Correo", render: (r) => r.correo },
			{
				key: "estado",
				header: "Estado",
				render: (r) => <StatusBadge status={r.estado} />
			},
			{
				key: "acciones",
				header: "Acciones",
				align: "right",
				render: () => (
					<div className="cli__actions">
						<SecondaryButton
							type="button"
							className="cli__actionBtn"
							onClick={() => {
								setModalMode("edit");
								setModalOpen(true);
							}}
						>
							Editar
						</SecondaryButton>
						<SecondaryButton
							type="button"
							className="cli__actionBtn cli__actionBtn--danger"
							onClick={() => setConfirmOpen(true)}
						>
							Eliminar
						</SecondaryButton>
					</div>
				)
			}
		],
		[]
	);

	return (
		<div className="cli">
			<PageHeader
				title="Clientes"
				subtitle="Administración de clientes registrados."
				actions={
					<PrimaryButton
						type="button"
						onClick={() => {
							setModalMode("create");
							setModalOpen(true);
						}}
					>
						Nuevo Cliente
					</PrimaryButton>
				}
			/>

			<div className="cli__controls">
				<div className="cli__search">
					<SearchBar placeholder="Buscar cliente..." />
				</div>
				<div className="cli__filters" aria-label="Filtro visual">
					<SecondaryButton type="button" className="cli__filterBtn cli__filterBtn--active">
						Todos
					</SecondaryButton>
					<SecondaryButton type="button" className="cli__filterBtn">
						Activos
					</SecondaryButton>
					<SecondaryButton type="button" className="cli__filterBtn">
						Inactivos
					</SecondaryButton>
				</div>
			</div>

			<div className="cli__table">
				<DataTable columns={columns} data={clientes} emptyState="No hay clientes." />
			</div>

			<Modal
				open={modalOpen}
				title={modalMode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
				onClose={() => setModalOpen(false)}
				footer={
					<div className="cli__modalActions">
						<SecondaryButton type="button" onClick={() => setModalOpen(false)}>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="button" onClick={() => setModalOpen(false)}>
							Guardar
						</PrimaryButton>
					</div>
				}
			>
				<form className="cli__form" onSubmit={(e) => e.preventDefault()}>
					<div className="cli__grid">
						<div className="cli__field">
							<label className="cli__label">Nombre</label>
							<input className="cli__input" type="text" placeholder="Nombre del cliente" defaultValue="" />
						</div>
						<div className="cli__field">
							<label className="cli__label">Documento</label>
							<input className="cli__input" type="text" placeholder="NIT / Cédula" defaultValue="" />
						</div>
						<div className="cli__field">
							<label className="cli__label">Teléfono</label>
							<input className="cli__input" type="text" placeholder="+57 ..." defaultValue="" />
						</div>
						<div className="cli__field">
							<label className="cli__label">Correo</label>
							<input className="cli__input" type="email" placeholder="correo@cliente.com" defaultValue="" />
						</div>
						<div className="cli__field cli__field--full">
							<label className="cli__label">Dirección</label>
							<input className="cli__input" type="text" placeholder="Dirección" defaultValue="" />
						</div>
						<div className="cli__field">
							<label className="cli__label">Estado</label>
							<select className="cli__select" defaultValue="Activo">
								<option value="Activo">Activo</option>
								<option value="Inactivo">Inactivo</option>
							</select>
						</div>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={confirmOpen}
				title="Eliminar cliente"
				message="Esta acción es solo visual. ¿Deseas continuar?"
				confirmText="Eliminar"
				cancelText="Cancelar"
				onConfirm={() => setConfirmOpen(false)}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}

