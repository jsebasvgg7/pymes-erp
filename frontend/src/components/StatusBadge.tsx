import "./StatusBadge.css";

type StatusBadgeProps = {
	status: "Activo" | "Inactivo" | "Pendiente" | "Pagado" | "Anulado" | "Ingreso" | "Egreso";
};

const statusClass: Record<StatusBadgeProps["status"], string> = {
	Activo: "ui-badge--active",
	Inactivo: "ui-badge--inactive",
	Pendiente: "ui-badge--pending",
	Pagado: "ui-badge--paid",
	Anulado: "ui-badge--void",
	Ingreso: "ui-badge--active",
	Egreso: "ui-badge--paid"
};

export default function StatusBadge({ status }: StatusBadgeProps) {
	return <span className={["ui-badge", statusClass[status]].join(" ")}>{status}</span>;
}

