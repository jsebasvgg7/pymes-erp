import { useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import "./DataTable.css";

export type DataTableLayout<T> = {
	principal: (row: T) => React.ReactNode;
	secundario?: (row: T) => React.ReactNode;
	etiquetas?: (row: T) => React.ReactNode;
	estado?: (row: T) => React.ReactNode;
	valor?: (row: T) => React.ReactNode;
	acciones?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
	layout: DataTableLayout<T>;
	title?: string;
	count?: number;
	headerActions?: React.ReactNode;
	onRowClick?: (row: T) => void;
	data: T[];
	emptyState?: React.ReactNode;
	pageSize?: number;
};

const slotWidths = {
	etiquetas: "minmax(96px, 150px)",
	estado: "104px",
	valor: "minmax(96px, 132px)",
	acciones: "auto"
};

export default function DataTable<T>({ layout, title, count, headerActions, onRowClick, data, emptyState, pageSize }: DataTableProps<T>) {
	const [currentPage, setCurrentPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize ?? 10);
	const pageCount = Math.ceil(data.length / rowsPerPage);
	const visiblePage = Math.min(currentPage, Math.max(pageCount - 1, 0));
	const visibleRows = useMemo(
		() => (pageSize ? data.slice(visiblePage * rowsPerPage, (visiblePage + 1) * rowsPerPage) : data),
		[data, pageSize, rowsPerPage, visiblePage]
	);

	useEffect(() => {
		setCurrentPage(0);
	}, [data]);

	const pagination = pageSize && data.length > 0 && (
		<div
			className={"ui-table__pagination ui-table__pagination--list"}
			aria-label="Paginación de resultados"
		>
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
				<button type="button" onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))} disabled={visiblePage === 0}>
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
	);

	const cols = [
		"minmax(0, 1fr)",
		layout.etiquetas && slotWidths.etiquetas,
		layout.estado && slotWidths.estado,
		layout.valor && slotWidths.valor,
		layout.acciones && slotWidths.acciones
	]
		.filter(Boolean)
		.join(" ");
	const rowStyle = { "--ui-list-cols": cols } as React.CSSProperties;
	const clickable = Boolean(onRowClick);

	return (
		<section className="ui-list" aria-label={title}>
			{title && (
				<header className="ui-list__head">
					<h3 className="ui-list__title">{title}</h3>
					<span className="ui-list__count">{(count ?? data.length).toLocaleString("es-CO")}</span>
					{headerActions && <div className="ui-list__headActions">{headerActions}</div>}
				</header>
			)}

			<div className="ui-list__body">
				{data.length === 0 ? (
					<div className="ui-list__empty">
						{emptyState ?? (
							<>
								<Inbox size={22} strokeWidth={1.6} aria-hidden="true" />
								<span>Sin datos para mostrar.</span>
							</>
						)}
					</div>
				) : (
					<ul className="ui-list__rows">
						{visibleRows.map((row, index) => (
							<li
								key={index}
								className={["ui-list__row", clickable ? "ui-list__row--clickable" : ""].join(" ").trim()}
								style={rowStyle}
								tabIndex={clickable ? 0 : undefined}
								onClick={clickable ? () => onRowClick?.(row) : undefined}
								onKeyDown={
									clickable
										? (event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													onRowClick?.(row);
												}
											}
										: undefined
								}
							>
								<div className="ui-list__main">
									<div className="ui-list__principal">{layout.principal(row)}</div>
									{layout.secundario && <div className="ui-list__secundario">{layout.secundario(row)}</div>}
								</div>
								{layout.etiquetas && <div className="ui-list__etiquetas">{layout.etiquetas(row)}</div>}
								{layout.estado && <div className="ui-list__estado">{layout.estado(row)}</div>}
								{layout.valor && <div className="ui-list__valor">{layout.valor(row)}</div>}
								{layout.acciones && (
									<div className="ui-list__acciones" onClick={(event) => event.stopPropagation()}>
										{layout.acciones(row)}
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>

			{pagination}
		</section>
	);
}
