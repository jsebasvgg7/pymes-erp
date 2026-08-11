import Modal from "./Modal";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import "./ConfirmDialog.css";

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
};

export default function ConfirmDialog({
	open,
	title,
	message,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	onConfirm,
	onCancel
}: ConfirmDialogProps) {
	return (
		<Modal
			open={open}
			title={title}
			onClose={onCancel}
			footer={
				<div className="ui-confirm__actions">
					<SecondaryButton type="button" onClick={onCancel}>
						{cancelText}
					</SecondaryButton>
					<PrimaryButton type="button" onClick={onConfirm}>
						{confirmText}
					</PrimaryButton>
				</div>
			}
		>
			<div className="ui-confirm__message">{message}</div>
		</Modal>
	);
}

