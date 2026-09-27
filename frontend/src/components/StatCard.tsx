import { ReactNode } from "react";
import "./StatCard.css";

type StatCardProps = {
	icon: ReactNode;
	title: string;
	value: string;
	color?: "blue" | "green" | "amber" | "red";
	footnote?: ReactNode;
	sparkline?: number[];
};

const colorClass: Record<NonNullable<StatCardProps["color"]>, string> = {
	blue: "ui-statCard__icon--blue",
	green: "ui-statCard__icon--green",
	amber: "ui-statCard__icon--amber",
	red: "ui-statCard__icon--red"
};

function Sparkline({ values }: { values: number[] }) {
	const max = Math.max(...values, 1);
	const barWidth = 4;
	const gap = 2;
	const height = 28;
	const width = values.length * barWidth + (values.length - 1) * gap;

	return (
		<svg
			className="ui-statCard__sparkline"
			viewBox={`0 0 ${width} ${height}`}
			width={width}
			height={height}
			aria-hidden="true"
		>
			{values.map((v, i) => {
				const barHeight = Math.max((v / max) * height, 2);
				return (
					<rect
						key={i}
						x={i * (barWidth + gap)}
						y={height - barHeight}
						width={barWidth}
						height={barHeight}
						rx={1.5}
					/>
				);
			})}
		</svg>
	);
}

export default function StatCard({ icon, title, value, color = "blue", footnote, sparkline }: StatCardProps) {
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
				{sparkline && sparkline.length > 0 ? <Sparkline values={sparkline} /> : null}
			</div>
			{footnote ? <div className="ui-statCard__foot">{footnote}</div> : null}
		</article>
	);
}