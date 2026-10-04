import "./SearchBar.css";

type SearchBarProps = {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
};

export default function SearchBar({ placeholder = "Buscar...", value, onChange }: SearchBarProps) {
	const controlled = value !== undefined;

	return (
		<div className="ui-search">
			<span className="ui-search__icon" aria-hidden="true">
				⌕
			</span>
			<input
				className="ui-search__input"
				type="text"
				placeholder={placeholder}
				{...(controlled ? { value } : {})}
				onChange={onChange ? (e) => onChange(e.target.value) : undefined}
			/>
		</div>
	);
}