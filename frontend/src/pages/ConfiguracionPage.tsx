import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import ConfigNav from "../components/configuracion/ConfigNav";
import ConfigFila from "../components/configuracion/ConfigFila";
import ConfigModalEditar from "../components/configuracion/ConfigModalEditar";
import { describirError, errorSesion, type ErrorPagina } from "../utils/erroresPagina";
import { MODULOS_CONFIG, type FilaConfig } from "../utils/configuracionModulos";
import { authService } from "../services/authService";
import { empresaService, type Empresa, type EmpresaUpdateRequest } from "../services/empresaService";
import { configuracionService, type Configuracion } from "../services/configuracionService";
import { aplicarFormatoEmpresa } from "../hooks/useFormatoEmpresa";
import "./ConfiguracionPage.css";

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err && typeof err === "object" && "response" in err) {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
}

function valorDeFila(fila: FilaConfig, empresa: Empresa | null, configuracion: Configuracion | null): string {
	if (fila.campo) return empresa?.[fila.campo] ?? "";
	if (fila.campoConfig) return String(configuracion?.[fila.campoConfig] ?? "");
	return "";
}

function textoDeFila(fila: FilaConfig, empresa: Empresa | null, configuracion: Configuracion | null): string {
	const valor = valorDeFila(fila, empresa, configuracion);
	if (fila.interruptor) return valor === "true" ? "Activado" : "Desactivado";
	if (fila.unidad && valor !== "") return `${valor} ${valor === "1" ? fila.unidad[0] : fila.unidad[1]}`;
	return fila.opciones?.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
}

function datoDeConfiguracion(campo: NonNullable<FilaConfig["campoConfig"]>, valor: string): string | number {
	if (campo === "stockMinimoDefecto") return Number(valor.replace(",", "."));
	if (campo === "diasVencimientoCredito") return valor === "" ? 0 : Number(valor);
	return valor;
}

export default function ConfiguracionPage() {
	const empresaId = authService.getUsuario()?.empresaId;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ErrorPagina | null>(null);
	const [empresa, setEmpresa] = useState<Empresa | null>(null);
	const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
	const [moduloActivo, setModuloActivo] = useState(MODULOS_CONFIG[0].id);
	const [editando, setEditando] = useState<FilaConfig | null>(null);
	const [guardando, setGuardando] = useState(false);
	const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
	const [aviso, setAviso] = useState<string | null>(null);
	const [errorFila, setErrorFila] = useState<string | null>(null);
	const [cambiandoId, setCambiandoId] = useState<string | null>(null);
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
			const [empresaCargada, configuracionCargada] = await Promise.all([
				empresaService.obtenerPorId(empresaId),
				configuracionService.obtener(empresaId)
			]);
			setEmpresa(empresaCargada);
			setConfiguracion(configuracionCargada);
			aplicarFormatoEmpresa(empresaId, configuracionCargada);
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

	const seleccionarModulo = (id: string) => {
		setErrorFila(null);
		setModuloActivo(id);
	};

	const mostrarAviso = (texto: string) => {
		if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
		setAviso(texto);
		avisoTimer.current = window.setTimeout(() => setAviso(null), 3500);
	};

	const cambiarInterruptor = async (fila: FilaConfig, activo: boolean) => {
		if (!fila.campoConfig || !empresaId || cambiandoId) return;
		setCambiandoId(fila.id);
		setErrorFila(null);
		try {
			const actualizada = await configuracionService.actualizar(empresaId, { [fila.campoConfig]: activo });
			setConfiguracion(actualizada);
			aplicarFormatoEmpresa(empresaId, actualizada);
			mostrarAviso(`${fila.etiqueta}: ${activo ? "activado" : "desactivado"}.`);
		} catch (err) {
			setErrorFila(extractErrorMessage(err, "No se pudo guardar el cambio. Intenta nuevamente."));
		} finally {
			setCambiandoId(null);
		}
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
		if (!editando || !empresa || !empresaId) return;
		const { campo, campoConfig } = editando;
		if (!campo && !campoConfig) return;

		setGuardando(true);
		setErrorGuardado(null);
		try {
			if (campoConfig) {
				const actualizada = await configuracionService.actualizar(empresaId, {
					[campoConfig]: datoDeConfiguracion(campoConfig, valor)
				});
				setConfiguracion(actualizada);
				aplicarFormatoEmpresa(empresaId, actualizada);
			} else if (campo) {
				const solicitud: EmpresaUpdateRequest = {
					nombre: empresa.nombre ?? "",
					nit: empresa.nit ?? "",
					direccion: empresa.direccion ?? "",
					telefono: empresa.telefono ?? "",
					email: empresa.email ?? ""
				};
				solicitud[campo] = valor;
				setEmpresa(await empresaService.actualizar(empresaId, solicitud));
			}
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
				<ConfigNav modulos={MODULOS_CONFIG} activo={moduloActivo} onSeleccionar={seleccionarModulo} />

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
					{errorFila ? (
						<span className="set__noticeError" role="alert">
							{errorFila}
						</span>
					) : null}

					<ul className="set__rows">
						{modulo.filas.map((fila) => (
							<ConfigFila
								key={fila.id}
								fila={fila}
								valor={textoDeFila(fila, empresa, configuracion)}
								onEditar={abrirEdicion}
								activo={fila.interruptor ? valorDeFila(fila, empresa, configuracion) === "true" : false}
								cambiando={cambiandoId === fila.id}
								onCambiar={cambiarInterruptor}
							/>
						))}
					</ul>
				</section>
			</div>

			{editando ? (
				<ConfigModalEditar
					key={editando.id}
					fila={editando}
					valorInicial={valorDeFila(editando, empresa, configuracion)}
					guardando={guardando}
					error={errorGuardado}
					onGuardar={guardarCampo}
					onCerrar={cerrarEdicion}
				/>
			) : null}
		</div>
	);
}
