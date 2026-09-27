import { useMemo, useState } from "react";
import { BarChart } from "../charts/bar-chart";
import { BarSquares } from "../charts/bar-squares";
import { Grid } from "../charts/grid";
import { BarXAxis } from "../charts/bar-x-axis";
import { ChartTooltip } from "../charts/tooltip/chart-tooltip";
import type { MovimientoCajaResponse } from "../../services/cajaService";
import { calcularFlujoCaja, type Periodo } from "../../services/dashboardAnalytics";
import "./dashboard-charts.css";

function formatCurrencyShort(value: number) {
	return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

type CashFlowChartProps = {
	movimientos: MovimientoCajaResponse[];
};

const PERIODOS: Array<{ value: Periodo; label: string }> = [
	{ value: "semanal", label: "Semanal" },
	{ value: "mensual", label: "Mensual" },
	{ value: "anual", label: "Anual" }
];

export default function CashFlowChart({ movimientos }: CashFlowChartProps) {
	const [periodo, setPeriodo] = useState<Periodo>("mensual");

	const { puntos, flujoNeto } = useMemo(
		() => calcularFlujoCaja(movimientos, periodo),
		[movimientos, periodo]
	);

	const hayDatos = puntos.length > 0;

	return (
		<article className="dbChart">
			<div className="dbChart__head">
				<span className="dbChart__title">Tendencia de flujo de cajas</span>
			</div>

			<div className="dbChart__subhead">
				<div className="dbChart__metric">
					Flujo neto: <strong>{formatCurrencyShort(flujoNeto)}</strong>
				</div>
				<div className="dbChart__controls">
					<div className="dbChart__legend">
						<span className="dbChart__legendDot dbChart__legendDot--ingreso" />
						Ingreso
						<span className="dbChart__legendDot dbChart__legendDot--egreso" />
						Egreso
					</div>
					<div className="dbChart__toggle" role="tablist" aria-label="Período">
						{PERIODOS.map((p) => (
							<button
								key={p.value}
								type="button"
								role="tab"
								aria-selected={periodo === p.value}
								className={`dbChart__toggleBtn ${periodo === p.value ? "dbChart__toggleBtn--active" : ""}`}
								onClick={() => setPeriodo(p.value)}
							>
								{p.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{hayDatos ? (
				<BarChart
					data={puntos}
					xDataKey="label"
					aspectRatio="2.4 / 1"
					barGap={0.35}
					margin={{ top: 16, right: 8, bottom: 28, left: 40 }}
				>
					<Grid horizontal strokeDasharray="3,4" />
					<BarSquares dataKey="ingreso" fill="var(--line)" squareGap={3} squareRadius={0.2} groupGap={3} />
					<BarSquares dataKey="egreso" fill="var(--ink)" squareGap={3} squareRadius={0.2} groupGap={3} />
					<BarXAxis maxLabels={12} />
					<ChartTooltip
						rows={(point) => [
							{ label: "Ingreso", value: formatCurrencyShort(Number(point.ingreso) || 0), color: "var(--muted)" },
							{ label: "Egreso", value: formatCurrencyShort(Number(point.egreso) || 0), color: "var(--ink)" }
						]}
					/>
				</BarChart>
			) : (
				<div className="dbChart__empty">Aún no hay movimientos de caja para este período.</div>
			)}
		</article>
	);
}