import { ReactNode } from "react";
import "./PageHeader.css";

type PageHeaderProps = {
	title: string;
	subtitle: string;
	actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
	return (
		<header className="ui-pageHeader">
			<div className="ui-pageHeader__text">
				<h1 className="ui-pageHeader__title">{title}</h1>
				<p className="ui-pageHeader__subtitle">{subtitle}</p>
			</div>
			{actions ? <div className="ui-pageHeader__actions">{actions}</div> : null}
		</header>
	);
}
