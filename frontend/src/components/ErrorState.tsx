import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, Copy, LockKeyhole, Mail, MessageCircle, RefreshCw, WifiOff, Wrench } from "lucide-react";
import LoadingState from "./LoadingState";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import {
	enlacesSoporte,
	formatearHora,
	normalizarError,
	textosError,
	type CausaError,
	type ErrorPagina,
	type PaginaClave
} from "../utils/erroresPagina";
import "./ErrorState.css";

interface ErrorStateProps {
	pagina: PaginaClave;
	error: ErrorPagina;
	onRetry: () => void;
}

const REINTENTOS_MAX = 2;
const ESPERA_MS = [2000, 2000];
const VENTANA_MS = 60000;

const reintentos = new Map<PaginaClave, { cantidad: number; ultimo: number }>();

function cantidadReintentos(pagina: PaginaClave): number {
	const registro = reintentos.get(pagina);
	if (!registro || Date.now() - registro.ultimo > VENTANA_MS) {
		reintentos.delete(pagina);
		return 0;
	}
	return registro.cantidad;
}

const ICONOS: Record<CausaError, typeof WifiOff> = {
	conexion: WifiOff,
	servidor: Wrench,
	sesion: LockKeyhole,
	inesperado: CircleAlert
};

function irAlLogin() {
	localStorage.removeItem("token");
	localStorage.removeItem("usuario");
	window.location.href = "/login";
}

export default function ErrorState({ pagina, error, onRetry }: ErrorStateProps) {
	const info = useMemo(() => normalizarError(pagina, error), [pagina, error]);
	const textos = textosError(info);
	const enlaces = useMemo(() => enlacesSoporte(info), [info]);
	const Icono = ICONOS[info.causa];

	const onRetryRef = useRef(onRetry);
	useEffect(() => {
		onRetryRef.current = onRetry;
	});

	const [esperando, setEsperando] = useState(() => info.reintentable && cantidadReintentos(pagina) < REINTENTOS_MAX);
	const [copiado, setCopiado] = useState(false);

	useEffect(() => {
		if (!esperando) return;
		const cantidad = cantidadReintentos(pagina);
		const temporizador = window.setTimeout(() => {
			reintentos.set(pagina, { cantidad: cantidad + 1, ultimo: Date.now() });
			onRetryRef.current();
		}, ESPERA_MS[cantidad] ?? ESPERA_MS[ESPERA_MS.length - 1]);
		return () => window.clearTimeout(temporizador);
	}, [esperando, pagina]);

	useEffect(() => {
		if (!info.sinInternet) return;
		const alVolverInternet = () => onRetryRef.current();
		window.addEventListener("online", alVolverInternet);
		return () => window.removeEventListener("online", alVolverInternet);
	}, [info.sinInternet]);

	useEffect(() => {
		if (!copiado) return;
		const temporizador = window.setTimeout(() => setCopiado(false), 2000);
		return () => window.clearTimeout(temporizador);
	}, [copiado]);

	if (esperando) {
		return <LoadingState label="Conectando con el sistema... no cierres esta página." />;
	}

	const reintentarAhora = () => {
		reintentos.delete(pagina);
		setEsperando(false);
		onRetry();
	};

	const copiarCodigo = async () => {
		try {
			await navigator.clipboard.writeText(info.codigo);
			setCopiado(true);
		} catch {
			setCopiado(false);
		}
	};

	const requiereSesion = info.causa === "sesion";

	return (
		<div className="errorState">
			<div className="errorState__card" role="alert">
				<div className="errorState__icon" aria-hidden="true">
					<Icono size={24} strokeWidth={1.8} />
				</div>
				<h2 className="errorState__title">{textos.titulo}</h2>
				<p className="errorState__text">{textos.mensaje}</p>
				{textos.consejo ? <p className="errorState__tip">{textos.consejo}</p> : null}

				<div className="errorState__actions">
					{requiereSesion ? (
						<PrimaryButton type="button" onClick={irAlLogin}>
							<LockKeyhole size={14} strokeWidth={2} />
							Iniciar sesión
						</PrimaryButton>
					) : (
						<>
							<PrimaryButton type="button" onClick={reintentarAhora}>
								<RefreshCw size={14} strokeWidth={2} />
								Intentar de nuevo
							</PrimaryButton>
							<SecondaryButton
								type="button"
								onClick={() => window.open(enlaces.whatsapp, "_blank", "noopener,noreferrer")}
							>
								<MessageCircle size={14} strokeWidth={2} />
								Avisar a soporte
							</SecondaryButton>
						</>
					)}
				</div>

				{requiereSesion ? null : (
					<>
						<a className="errorState__mail" href={enlaces.correo}>
							<Mail size={13} strokeWidth={2} />
							o escríbenos al correo
						</a>
						<button type="button" className="errorState__code" onClick={copiarCodigo}>
							{copiado ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={2} />}
							{copiado ? "Código copiado" : `Código de ayuda: ${info.codigo} · ${formatearHora(info.hora)}`}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
