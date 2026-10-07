import { ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
	open: boolean;
	title?: ReactNode;
	subtitle?: string;
	icon?: ReactNode;
	size?: "sm" | "md" | "lg";
	children: ReactNode;
	footer?: ReactNode;
	onClose?: () => void;
};

export default function Modal({ open, title, subtitle, icon, size = "sm", children, footer, onClose }: ModalProps) {
	if (!open) return null;

	const structured = typeof title === "string" || Boolean(subtitle) || Boolean(icon);

	return (
		<div className="ui-modal" role="dialog" aria-modal="true">
			<div className="ui-modal__backdrop" onClick={onClose} />
			<div className={`ui-modal__panel ui-modal__panel--${size}`}>
				{title ? (
					<div className="ui-modal__title">
						{structured ? (
							<>
								<div className="ui-modal__heading">
									{icon}
									<span>{title}</span>
								</div>
								{subtitle ? <p className="ui-modal__subtitle">{subtitle}</p> : null}
							</>
						) : (
							title
						)}
					</div>
				) : null}
				<div className="ui-modal__body">{children}</div>
				{footer ? <div className="ui-modal__footer">{footer}</div> : null}
			</div>
		</div>
	);
}
