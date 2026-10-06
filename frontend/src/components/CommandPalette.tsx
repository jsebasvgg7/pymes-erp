import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, CornerDownLeft, Search } from "lucide-react";
import { buscarComandos, type CommandEntry } from "../utils/commandCatalog";
import "./CommandPalette.css";

type CommandPaletteProps = {
	open: boolean;
	onClose: () => void;
	onLogout: () => void;
};

type DialogProps = Omit<CommandPaletteProps, "open">;

function PaletteDialog({ onClose, onLogout }: DialogProps) {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const previoRef = useRef<HTMLElement | null>(null);

	const results = useMemo(() => buscarComandos(query), [query]);

	useEffect(() => {
		previoRef.current = document.activeElement as HTMLElement | null;
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		listRef.current
			?.querySelector('[data-active="true"]')
			?.scrollIntoView({ block: "nearest" });
	}, [activeIndex, results]);

	function cancelar() {
		onClose();
		previoRef.current?.focus();
	}

	function elegir(entry: CommandEntry | undefined) {
		if (!entry) return;
		onClose();
		if (entry.accion === "logout") {
			onLogout();
			return;
		}
		if (entry.path) navigate(entry.path);
	}

	function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown" && results.length > 0) {
			event.preventDefault();
			setActiveIndex((i) => (i + 1) % results.length);
		} else if (event.key === "ArrowUp" && results.length > 0) {
			event.preventDefault();
			setActiveIndex((i) => (i - 1 + results.length) % results.length);
		} else if (event.key === "Enter") {
			event.preventDefault();
			elegir(results[activeIndex]);
		}
	}

	function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			cancelar();
		}
	}

	return (
		<div className="cmdk__overlay" onMouseDown={cancelar}>
			<div
				className="cmdk"
				role="dialog"
				aria-modal="true"
				aria-label="Buscar en la aplicación"
				onMouseDown={(event) => event.stopPropagation()}
				onKeyDown={handleDialogKeyDown}
			>
				<div className="cmdk__searchRow">
					<Search size={17} className="cmdk__searchIcon" aria-hidden="true" />
					<input
						ref={inputRef}
						className="cmdk__input"
						type="text"
						role="combobox"
						aria-expanded="true"
						aria-controls="cmdk-list"
						aria-activedescendant={results[activeIndex] ? `cmdk-${results[activeIndex].id}` : undefined}
						aria-autocomplete="list"
						placeholder="Busca páginas o acciones"
						autoComplete="off"
						spellCheck={false}
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setActiveIndex(0);
						}}
						onKeyDown={handleInputKeyDown}
					/>
					<kbd className="cmdk__kbd">Esc</kbd>
				</div>

				<ul id="cmdk-list" ref={listRef} className="cmdk__list" role="listbox">
					{results.length === 0 && (
						<li className="cmdk__empty" role="presentation">
							Sin resultados para "{query.trim()}"
						</li>
					)}

					{results.map((entry, index) => {
						const Icon = entry.icon;
						const active = index === activeIndex;
						const showGroup = index === 0 || results[index - 1].group !== entry.group;

						return (
							<li key={entry.id} role="presentation">
								{showGroup && <div className="cmdk__group">{entry.group}</div>}
								<div
									id={`cmdk-${entry.id}`}
									role="option"
									aria-selected={active}
									data-active={active}
									className={`cmdk__item ${active ? "cmdk__item--active" : ""}`}
									onMouseMove={() => setActiveIndex(index)}
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => elegir(entry)}
								>
									<span className="cmdk__itemIcon" aria-hidden="true">
										<Icon size={16} strokeWidth={1.8} />
									</span>
									<span className="cmdk__itemLabel">{entry.label}</span>
									<span className="cmdk__itemHint">{entry.hint}</span>
								</div>
							</li>
						);
					})}
				</ul>

				<div className="cmdk__footer" aria-hidden="true">
					<span className="cmdk__footerKey">
						<ArrowUp size={12} />
						<ArrowDown size={12} />
						Navegar
					</span>
					<span className="cmdk__footerKey">
						<CornerDownLeft size={12} />
						Abrir
					</span>
				</div>
			</div>
		</div>
	);
}

export default function CommandPalette({ open, onClose, onLogout }: CommandPaletteProps) {
	if (!open) return null;
	return createPortal(<PaletteDialog onClose={onClose} onLogout={onLogout} />, document.body);
}
