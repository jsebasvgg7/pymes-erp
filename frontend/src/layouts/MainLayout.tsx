import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
	return (
		<div>
			<header style={{ padding: 16, borderBottom: "1px solid #e5e5e5" }}>
				<nav style={{ display: "flex", gap: 12 }}>
					<Link to="/">Inicio</Link>
				</nav>
			</header>
			<Outlet />
		</div>
	);
}

