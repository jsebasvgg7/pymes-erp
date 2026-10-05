import { useEffect, useMemo, useState } from "react";
import "./DataTable.css";

export type DataTableColumn<T> = {
	key: string;
	header: string;
	align?: "left" | "right" | "center";
	width?: string;
	render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
	columns: Array<DataTableColumn<T>>;
	data: T[];
	emptyState?: React.ReactNode;
	pageSize?: number;
};

export default function DataTable<T>({ columns, data, emptyState, pageSize }: DataTableProps<T>) {
	const [currentPage, setCurrentPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize ?? 10);
	const pageCount = Math.ceil(data.length / rowsPerPage);
	const visiblePage = Math.min(currentPage, Math.max(pageCount - 1, 0));
	const visibleRows = useMemo(
		() => (pageSize ? data.slice(visiblePage * rowsPerPage, (visiblePage + 1) * rowsPerPage) : data),
		[data, pageSize, rowsPerPage, visiblePage]
	);
	const gridStyle = { gridTemplateColumns: columns.map((c) => c.width ?? "minmax(110px, 1fr)").join(" ") };

	useEffect(() => {
		setCurrentPage(0);
	}, [data]);

	return (
		<div className="ui-table">
			<div className="ui-table__scroll" role="table" aria-label="Tabla">
				<div className="ui-table__row ui-table__row--head" role="row" style={gridStyle}>
					{columns.map((col) => (
						<div
							key={col.key}
							className="ui-table__cell ui-table__cell--head"
							role="columnheader"
							style={{ textAlign: col.align ?? "left" }}
						>
							{col.header}
						</div>
					))}
				</div>

				{data.length === 0 ? (
					<div className="ui-table__empty">{emptyState ?? "Sin datos para mostrar."}</div>
				) : (
					visibleRows.map((row, index) => (
						<div className="ui-table__row" role="row" key={index} style={gridStyle}>
							{columns.map((col) => (
								<div
									key={col.key}
									className="ui-table__cell"
									role="cell"
									style={{ textAlign: col.align ?? "left" }}
								>
									{col.render(row)}
								</div>
							))}
						</div>
					))
				)}
			</div>
			{pageSize && data.length > 0 && (
				<div className="ui-table__pagination" aria-label="Paginación de resultados">
					<span className="ui-table__paginationInfo" aria-live="polite">
						Mostrando {visiblePage * rowsPerPage + 1}–{Math.min((visiblePage + 1) * rowsPerPage, data.length)} de {data.length}
					</span>
					<label className="ui-table__pageSize">
						<span>Filas por página</span>
						<select
							value={rowsPerPage}
							onChange={(event) => {
								setRowsPerPage(Number(event.target.value));
								setCurrentPage(0);
							}}
						>
							{[10, 25, 50, 100].map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
					</label>
					<div className="ui-table__pageControls">
						<button
							type="button"
							onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
							disabled={visiblePage === 0}
						>
							Anterior
						</button>
						<span>
							Página {visiblePage + 1} de {Math.max(pageCount, 1)}
						</span>
						<button
							type="button"
							onClick={() => setCurrentPage((page) => Math.min(page + 1, pageCount - 1))}
							disabled={visiblePage >= pageCount - 1}
						>
							Siguiente
						</button>
					</div>
				</div>
			)}
		</div>
	);
}