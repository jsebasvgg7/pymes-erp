import "./SummaryPanel.css";

type SummaryItem = {
	key: string | number;
	primary: string;
	secondary?: string;
	value?: string;
	onClick?: () => void;
};

type SummarySection = {
	title: string;
	items: SummaryItem[];
	emptyText: string;
};

type SummaryPanelProps = {
	title: string;
	subtitle: string;
	stats: { label: string; value: string | number }[];
	sections: SummarySection[];
};

function initialOf(text: string) {
	return text.trim().charAt(0).toUpperCase() || "?";
}

export default function SummaryPanel({ title, subtitle, stats, sections }: SummaryPanelProps) {
	return (
		<aside className="ui-summary">
			<div className="ui-summary__head">
				<h2 className="ui-summary__title">{title}</h2>
				<p className="ui-summary__subtitle">{subtitle}</p>
			</div>

			<div className="ui-summary__stats">
				{stats.map((s) => (
					<div key={s.label} className="ui-summary__stat">
						<span className="ui-summary__statValue">{s.value}</span>
						<span className="ui-summary__statLabel">{s.label}</span>
					</div>
				))}
			</div>

			{sections.map((section) => (
				<div key={section.title} className="ui-summary__section">
					<h3 className="ui-summary__sectionTitle">{section.title}</h3>
					{section.items.length === 0 ? (
						<p className="ui-summary__empty">{section.emptyText}</p>
					) : (
						<ul className="ui-summary__list">
							{section.items.map((item) => {
								const content = (
									<>
										<span className="ui-summary__avatar" aria-hidden="true">
											{initialOf(item.primary)}
										</span>
										<span className="ui-summary__text">
											<span className="ui-summary__primary">{item.primary}</span>
											{item.secondary ? <span className="ui-summary__secondary">{item.secondary}</span> : null}
										</span>
										{item.value ? <span className="ui-summary__value">{item.value}</span> : null}
									</>
								);
								return (
									<li key={item.key}>
										{item.onClick ? (
											<button type="button" className="ui-summary__row ui-summary__row--action" onClick={item.onClick}>
												{content}
											</button>
										) : (
											<div className="ui-summary__row">{content}</div>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			))}
		</aside>
	);
}
