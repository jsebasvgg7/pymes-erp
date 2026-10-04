import { useState } from "react";

function getInitial(nombre?: string | null) {
	if (!nombre) return "?";
	return nombre.trim().charAt(0).toUpperCase();
}

function blobatarUrl(name: string, size = 64) {
	return `https://blobatar.dev/avatar/${encodeURIComponent(name)}?size=${size}&background=circle`;
}

type AvatarProps = {
	name: string;
	size: number;
	className: string;
	fallbackClassName: string;
};

export default function Avatar({ name, size, className, fallbackClassName }: AvatarProps) {
	const [failed, setFailed] = useState(false);

	if (!name || failed) {
		return (
			<div className={fallbackClassName} aria-hidden="true">
				{getInitial(name)}
			</div>
		);
	}

	return <img src={blobatarUrl(name, size)} alt="" className={className} onError={() => setFailed(true)} />;
}
