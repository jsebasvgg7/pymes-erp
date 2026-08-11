import { Link } from "react-router-dom";

export default function NotFoundPage() {
	return (
		<main>
			<h1>404</h1>
			<p>Página no encontrada.</p>
			<Link to="/">Volver al inicio</Link>
		</main>
	);
}

