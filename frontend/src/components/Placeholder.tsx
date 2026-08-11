export default function Placeholder({ title }: { title: string }) {
	return (
		<div style={{ padding: 16, border: "1px dashed #bdbdbd" }}>
			<strong>{title}</strong>
		</div>
	);
}

