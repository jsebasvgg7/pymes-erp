import "./SearchBar.css";

type SearchBarProps = {
	placeholder?: string;
};

export default function SearchBar({ placeholder = "Buscar..." }: SearchBarProps) {
	return (
		<div className="ui-search">
			<span className="ui-search__icon" aria-hidden="true">
				⌕
			</span>
			<input className="ui-search__input" type="text" placeholder={placeholder} />
		</div>
	);
}

