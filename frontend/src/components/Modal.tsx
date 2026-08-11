import { ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
	open: boolean;
	title?: string;
	children: ReactNode;
	footer?: ReactNode;
	onClose?: () => void;
};

export default function Modal({ open, title, children, footer, onClose }: ModalProps) {
	if (!open) return null;

	return (
		<div className="ui-modal" role="dialog" aria-modal="true">
			<div className="ui-modal__backdrop" onClick={onClose} />
			<div className="ui-modal__panel">
				{title ? <div className="ui-modal__title">{title}</div> : null}
				<div className="ui-modal__body">{children}</div>
				{footer ? <div className="ui-modal__footer">{footer}</div> : null}
			</div>
		</div>
	);
}

