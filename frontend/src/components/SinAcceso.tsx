import { Lock } from "lucide-react";
import "./SinAcceso.css";

export default function SinAcceso() {
	return (
		<div className="sinAcceso" role="status">
			<span className="sinAcceso__icon" aria-hidden="true">
				<Lock size={20} strokeWidth={1.8} />
			</span>
			<div className="sinAcceso__title">Tu usuario no tiene paneles asignados.</div>
			<div className="sinAcceso__text">Pide a un administrador que te asigne un rol con acceso.</div>
		</div>
	);
}
