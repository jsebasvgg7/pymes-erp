import { useMemo } from "react";
import { Info, Check } from "lucide-react";
import { BarChart } from "../charts/bar-chart";
import { Bar } from "../charts/bar";
import { Grid } from "../charts/grid";
import { BarXAxis } from "../charts/bar-x-axis";
import { ChartTooltip } from "../charts/tooltip/chart-tooltip";
import type { CategoriaVenta } from "../../services/dashboardAnalytics";
import { totalVentasPorCategoria, promedioVentasPorCategoria } from "../../services/dashboardAnalytics";
import "./dashboard-charts.css";

function formatCurrencyShort(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDateInput(value: Date) {
	return value.toISOString().slice(0, 10);
}

type CategoryBreakdownChartProps = {
	categorias: CategoriaVenta[];
	fechaInicio: string;
	fechaFin: string;
	onChangeRango: (inicio: string, fin: string) => void;
};

export default function CategoryBreakdownChart({
	categorias,
	fechaInicio,
	fechaFin,
	onChangeRango
}: CategoryBreakdownChartProps) {
	const total = useMemo(() => totalVentasPorCategoria(categorias), [categorias]);
	const promedio = useMemo(() => promedioVentasPorCategoria(categorias), [categorias]);
	const data = useMemo(
		() => categorias.map((c) => ({ label: c.categoria, total: c.total, promedio })),
		[categorias, promedio]
	);
	const hayDatos = data.length > 0;

	return (
		<article className="dbChart">
			<div className="dbChart__head">
				<div className="dbChart__headLeft">
					<span className="dbChart__title">Desglose de ventas por categorías</span>
					<Info size={13} strokeWidth={2} className="dbChart__infoIcon" />
				</div>
				<span className="dbChart__verifiedBadge">
					<Check size={12} strokeWidth={3} />
				</span>
			</div>

			<div className="dbChart__subhead">
				<div className="dbChart__metric">
					<span className="dbChart__metricLabel">Valor </span>
					<strong>{formatCurrencyShort(total)}</strong>
				</div>
				<div className="dbChart__dateRange">
					<input
						type="date"
						value={fechaInicio}
						max={fechaFin}
						onChange={(e) => onChangeRango(e.target.value, fechaFin)}
						aria-label="Fecha de inicio"
					/>
					<span className="dbChart__dateSep">–</span>
					<input
						type="date"
						value={fechaFin}
						min={fechaInicio}
						max={formatDateInput(new Date())}
						onChange={(e) => onChangeRango(fechaInicio, e.target.value)}
						aria-label="Fecha de fin"
					/>
				</div>
			</div>

			{hayDatos ? (
				<BarChart
					data={data}
					xDataKey="label"
					aspectRatio="1.7 / 1"
					barGap={0.45}
					margin={{ top: 28, right: 8, bottom: 28, left: 40 }}
				>
					<Grid horizontal strokeDasharray="3,4" />
					<Bar dataKey="total" fill="var(--ink)" />
					<BarXAxis maxLabels={8} />
					<ChartTooltip
						rows={(point) => [
							{ label: String(point.label), value: formatCurrencyShort(Number(point.total) || 0), color: "var(--ink)" },
							{ label: "Promedio", value: formatCurrencyShort(Number(point.promedio) || 0), color: "var(--muted)" }
						]}
					/>
				</BarChart>
			) : (
				<div className="dbChart__empty">No hay ventas registradas en este rango.</div>
			)}
		</article>
	);
}