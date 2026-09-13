import "./LoadingState.css";

interface LoadingStateProps {
	/** Texto a mostrar, ej: "Cargando categorías..." */
	label: string;
}

/**
 * Estado de carga reutilizable con 3 dots animados, centrado.
 * Reemplaza el texto plano en los bloques `if (loading) { ... }` de cada página.
 *
 * Uso:
 *   <div className="cat">
 *     <LoadingState label="Cargando categorías..." />
 *   </div>
 */
export default function LoadingState({ label }: LoadingStateProps) {
	return (
		<div className="loadingState">
			<div className="loadingState__dots">
				<span className="loadingState__dot" />
				<span className="loadingState__dot" />
				<span className="loadingState__dot" />
			</div>
			<p className="loadingState__label">{label}</p>
		</div>
	);
}
