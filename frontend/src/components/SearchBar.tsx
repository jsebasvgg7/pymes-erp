import type { KeyboardEvent, Ref } from "react";
import { Search } from "lucide-react";
import "./SearchBar.css";

type SearchBarProps = {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
	inputRef?: Ref<HTMLInputElement>;
	autoFocus?: boolean;
};

export default function SearchBar({
	placeholder = "Buscar...",
	value,
	onChange,
	onKeyDown,
	inputRef,
	autoFocus
}: SearchBarProps) {
	const controlled = value !== undefined;

	return (
		<div className="ui-search">
			<span className="ui-search__icon" aria-hidden="true">
				<Search size={15} strokeWidth={2} />
			</span>
			<input
				ref={inputRef}
				className="ui-search__input"
				type="text"
				placeholder={placeholder}
				autoFocus={autoFocus}
				onKeyDown={onKeyDown}
				{...(controlled ? { value } : {})}
				onChange={onChange ? (e) => onChange(e.target.value) : undefined}
			/>
		</div>
	);
}