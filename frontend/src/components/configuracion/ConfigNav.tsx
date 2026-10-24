import type { ModuloConfig } from "../../utils/configuracionModulos";

type ConfigNavProps = {
	modulos: ModuloConfig[];
	activo: string;
	onSeleccionar: (id: string) => void;
};

export default function ConfigNav({ modulos, activo, onSeleccionar }: ConfigNavProps) {
	return (
		<nav className="set__nav" aria-label="Categorías de configuración">
			<ul className="set__navList">
				{modulos.map((modulo) => {
					const Icono = modulo.icono;
					const seleccionado = modulo.id === activo;
					return (
						<li key={modulo.id}>
							<button
								type="button"
								className={["set__navItem", seleccionado ? "set__navItem--active" : ""].filter(Boolean).join(" ")}
								aria-current={seleccionado ? "page" : undefined}
								onClick={() => onSeleccionar(modulo.id)}
							>
								<Icono size={16} aria-hidden="true" />
								<span>{modulo.titulo}</span>
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
