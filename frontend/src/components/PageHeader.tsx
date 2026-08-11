import { ReactNode } from "react";
import "./PageHeader.css";

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
	return (
		<div className="ui-pageHeader">
			<div className="ui-pageHeader__text">
				<h2 className="ui-pageHeader__title">{title}</h2>
				{subtitle ? <p className="ui-pageHeader__subtitle">{subtitle}</p> : null}
			</div>
			{actions ? <div className="ui-pageHeader__actions">{actions}</div> : null}
		</div>
	);
}

