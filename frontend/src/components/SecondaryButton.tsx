import "./SecondaryButton.css";

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function SecondaryButton({ className, ...props }: SecondaryButtonProps) {
	return <button {...props} className={["ui-btnSecondary", className].filter(Boolean).join(" ")} />;
}

