import "./PrimaryButton.css";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryButton({ className, ...props }: PrimaryButtonProps) {
	return <button {...props} className={["ui-btnPrimary", className].filter(Boolean).join(" ")} />;
}

