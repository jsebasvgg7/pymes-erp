import { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import "./StatCard.css";

type StatCardProps = {
	icon: ReactNode;
	title: string;
	value: string;
	color?: "blue" | "green" | "amber" | "red";
	/** Texto de variación, p. ej. "+3 ayer". Se omite si no hay dato real que lo respalde. */
	variation?: string;
};

const colorClass: Record<NonNullable<StatCardProps["color"]>, string> = {
	blue: "ui-statCard__icon--blue",
	green: "ui-statCard__icon--green",
	amber: "ui-statCard__icon--amber",
	red: "ui-statCard__icon--red"
};

export default function StatCard({ icon, title, value, color = "blue", variation }: StatCardProps) {
	return (
		<article className="ui-statCard">
			<div className={`ui-statCard__icon ${colorClass[color]}`} aria-hidden="true">
				{icon}
			</div>
			<div className="ui-statCard__label">{title}</div>
			<div className="ui-statCard__value">{value}</div>
			{variation ? (
				<div className="ui-statCard__foot">
					<ArrowUpRight size={13} strokeWidth={2} />
					{variation}
				</div>
			) : null}
		</article>
	);
}