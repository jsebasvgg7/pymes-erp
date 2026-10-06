import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useAccionRapida(accion: string, ejecutar: () => void) {
	const [params, setParams] = useSearchParams();
	const ejecutarRef = useRef(ejecutar);
	ejecutarRef.current = ejecutar;

	useEffect(() => {
		if (params.get("accion") !== accion) return;
		ejecutarRef.current();
		const siguiente = new URLSearchParams(params);
		siguiente.delete("accion");
		setParams(siguiente, { replace: true });
	}, [params, accion, setParams]);
}
