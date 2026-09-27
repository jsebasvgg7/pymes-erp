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
};

export default function DataTable<T>({ columns, data, emptyState }: DataTableProps<T>) {
	const gridStyle = { gridTemplateColumns: columns.map((c) => c.width ?? "minmax(110px, 1fr)").join(" ") };

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
					data.map((row, index) => (
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
		</div>
	);
}