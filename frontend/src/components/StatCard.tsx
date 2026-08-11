import "./StatCard.css";

type StatCardProps = {
	icon: string;
	title: string;
	value: string;
	color?: "blue" | "green" | "amber" | "red";
	footnote?: string;
};

const colorClass: Record<NonNullable<StatCardProps["color"]>, string> = {
	blue: "ui-statCard__icon--blue",
	green: "ui-statCard__icon--green",
	amber: "ui-statCard__icon--amber",
	red: "ui-statCard__icon--red"
};

export default function StatCard({ icon, title, value, color = "blue", footnote = "Ejemplo" }: StatCardProps) {
	return (
		<article className="ui-statCard">
			<div className="ui-statCard__top">
				<div className={`ui-statCard__icon ${colorClass[color]}`} aria-hidden="true">
					{icon}
				</div>
				<div className="ui-statCard__meta">
					<div className="ui-statCard__label">{title}</div>
					<div className="ui-statCard__value">{value}</div>
				</div>
			</div>
			<div className="ui-statCard__foot">{footnote}</div>
		</article>
	);
}

