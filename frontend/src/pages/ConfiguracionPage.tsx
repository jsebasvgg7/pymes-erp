import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import ConfigNav from "../components/configuracion/ConfigNav";
import ConfigFila from "../components/configuracion/ConfigFila";
import ConfigModalEditar from "../components/configuracion/ConfigModalEditar";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import { MODULOS_CONFIG, type CampoEmpresa, type FilaConfig } from "../utils/configuracionModulos";
import { authService } from "../services/authService";
import { empresaService, type Empresa, type EmpresaUpdateRequest } from "../services/empresaService";
import "./ConfiguracionPage.css";

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

function valorDeCampo(empresa: Empresa | null, campo: CampoEmpresa): string {
	return empresa?.[campo] ?? "";
}

export default function ConfiguracionPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ErrorPagina | null>(null);
	const [empresa, setEmpresa] = useState<Empresa | null>(null);
	const [moduloActivo, setModuloActivo] = useState(MODULOS_CONFIG[0].id);
	const [editando, setEditando] = useState<FilaConfig | null>(null);
	const [guardando, setGuardando] = useState(false);
	const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
	const [aviso, setAviso] = useState<string | null>(null);
	const avisoTimer = useRef<number | null>(null);

	const loadData = useCallback(async () => {
		if (!empresaId) {
			setError(errorSesion("configuracion"));
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			setEmpresa(await empresaService.obtenerPorId(empresaId));
		} catch (err) {
			setError(describirError("configuracion", err));
		} finally {
			setLoading(false);
		}
	}, [empresaId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		return () => {
			if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
		};
	}, []);

	const modulo = useMemo(
		() => MODULOS_CONFIG.find((m) => m.id === moduloActivo) ?? MODULOS_CONFIG[0],
		[moduloActivo]
	);

	const mostrarAviso = (texto: string) => {
		if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
		setAviso(texto);
		avisoTimer.current = window.setTimeout(() => setAviso(null), 3500);
	};

	const abrirEdicion = (fila: FilaConfig) => {
		setErrorGuardado(null);
		setEditando(fila);
	};

	const cerrarEdicion = () => {
		if (guardando) return;
		setEditando(null);
		setErrorGuardado(null);
	};

	const guardarCampo = async (valor: string) => {
		if (!editando?.campo || !empresa || !empresaId) return;

		const solicitud: EmpresaUpdateRequest = {
			nombre: empresa.nombre ?? "",
			nit: empresa.nit ?? "",
			direccion: empresa.direccion ?? "",
			telefono: empresa.telefono ?? "",
			email: empresa.email ?? ""
		};
		solicitud[editando.campo] = valor;

		setGuardando(true);
		setErrorGuardado(null);
		try {
			const actualizada = await empresaService.actualizar(empresaId, solicitud);
			setEmpresa(actualizada);
			setEditando(null);
			mostrarAviso(`${editando.etiqueta} actualizado.`);
		} catch (err) {
			setErrorGuardado(extractErrorMessage(err, "No se pudo guardar el cambio. Intenta nuevamente."));
		} finally {
			setGuardando(false);
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
				<ErrorState pagina="configuracion" error={error} onRetry={loadData} />
			</div>
		);
	}

	const IconoModulo = modulo.icono;

	return (
		<div className="set">
			<PageHeader
				title="Ajustes del negocio"
				subtitle="Administra los datos de tu empresa y las preferencias del sistema."
			/>

			<div className="set__layout">
				<ConfigNav modulos={MODULOS_CONFIG} activo={moduloActivo} onSeleccionar={setModuloActivo} />

				<section className="set__panel" aria-labelledby="set-panel-title">
					<header className="set__panelHead">
						<span className="set__panelIcon" aria-hidden="true">
							<IconoModulo size={20} />
						</span>
						<div className="set__panelText">
							<h2 id="set-panel-title" className="set__panelTitle">
								{modulo.titulo}
							</h2>
							<p className="set__panelDesc">{modulo.descripcion}</p>
						</div>
					</header>

					<div role="status" aria-live="polite">
						{aviso ? <span className="set__notice">{aviso}</span> : null}
					</div>

					<ul className="set__rows">
						{modulo.filas.map((fila) => (
							<ConfigFila
								key={fila.id}
								fila={fila}
								valor={fila.campo ? valorDeCampo(empresa, fila.campo) : ""}
								onEditar={abrirEdicion}
							/>
						))}
					</ul>
				</section>
			</div>

			{editando?.campo ? (
				<ConfigModalEditar
					key={editando.id}
					fila={editando}
					valorInicial={valorDeCampo(empresa, editando.campo)}
					guardando={guardando}
					error={errorGuardado}
					onGuardar={guardarCampo}
					onCerrar={cerrarEdicion}
				/>
			) : null}
		</div>
	);
}
