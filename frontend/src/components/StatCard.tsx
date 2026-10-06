import { ReactNode } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import "./StatCard.css";

type StatCardProps = {
	icon: ReactNode;
	title: string;
	value: string;
	color?: "blue" | "green" | "amber" | "red";
	/** Variación respecto a ayer. direction decide el ícono; text es lo que se muestra, p. ej. "3 ayer". Si se omite, se muestra "sin cambios". */
	variation?: { direction: "up" | "down"; text: string };
	/** Texto fijo al pie, sin indicador de tendencia. Tiene prioridad sobre variation. */
	footnote?: string;
};

const colorClass: Record<NonNullable<StatCardProps["color"]>, string> = {
	blue: "ui-statCard__icon--blue",
	green: "ui-statCard__icon--green",
	amber: "ui-statCard__icon--amber",
	red: "ui-statCard__icon--red"
};

export default function StatCard({ icon, title, value, color = "blue", variation, footnote }: StatCardProps) {
	const direction = variation?.direction ?? "none";
	const text = variation?.text ?? "sin cambios";

	return (
		<article className="ui-statCard">
			<div className="ui-statCard__head">
				<div className={`ui-statCard__icon ${colorClass[color]}`} aria-hidden="true">
					{icon}
				</div>
				<div className="ui-statCard__headText">
					<div className="ui-statCard__label">{title}</div>
					<div className="ui-statCard__value">{value}</div>
				</div>
			</div>
			<div className="ui-statCard__foot">
				{footnote !== undefined ? (
					<span className="ui-statCard__footText">{footnote}</span>
				) : (
					<>
						<span className={`ui-statCard__trend ui-statCard__trend--${direction}`}>
							{direction === "up" ? (
								<ArrowUp size={14} strokeWidth={2.25} />
							) : direction === "down" ? (
								<ArrowDown size={14} strokeWidth={2.25} />
							) : (
								<Minus size={14} strokeWidth={2.25} />
							)}
						</span>
						<span className="ui-statCard__footText">{text}</span>
					</>
				)}
			</div>
		</article>
	);
}