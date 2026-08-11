import { ReactNode, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import SecondaryButton from "../components/SecondaryButton";
import "./DashboardLayout.css";

type MenuItem = {
	label: string;
	icon: string;
	path?: string;
};

const menuItems: MenuItem[] = [
	{ label: "Dashboard", icon: "▦", path: "/dashboard" },
	{ label: "Clientes", icon: "👥", path: "/clientes" },
	{ label: "Proveedores", icon: "🏢", path: "/proveedores" },
	{ label: "Productos", icon: "📦", path: "/productos" },
	{ label: "Categorías", icon: "🏷", path: "/categorias" },
	{ label: "Inventario", icon: "📊", path: "/inventario" },
	{ label: "Compras", icon: "🧾", path: "/compras" },
	{ label: "POS", icon: "🛒", path: "/pos" },
	{ label: "Ventas", icon: "💳" },
	{ label: "Caja", icon: "💰", path: "/caja" },
	{ label: "Reportes", icon: "📈", path: "/reportes" },
	{ label: "Usuarios", icon: "👤", path: "/usuarios" },
	{ label: "Configuración", icon: "⚙", path: "/configuracion" }
];

export default function DashboardLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	const sidebar = useMemo<ReactNode>(() => {
		return (
			<aside className={`dash__sidebar ${sidebarOpen ? "dash__sidebar--open" : ""}`}>
				<div className="dash__sidebarHeader">
					<div className="dash__brand">
						<div className="dash__brandMark" aria-hidden="true">
							▤
						</div>
						<div className="dash__brandText">
							<div className="dash__brandTitle">Contabilidad PYMES</div>
							<div className="dash__brandCaption">ERP</div>
						</div>
					</div>
				</div>

				<nav className="dash__nav" aria-label="Menú principal">
					{menuItems.map((item) => {
						const isActive = item.path ? location.pathname.startsWith(item.path) : false;

						if (!item.path) {
							return (
								<button key={item.label} type="button" className="dash__navItem">
									<span className="dash__navIcon" aria-hidden="true">
										{item.icon}
									</span>
									<span className="dash__navLabel">{item.label}</span>
								</button>
							);
						}

						return (
							<NavLink
								key={item.label}
								to={item.path}
								className={`dash__navItem ${isActive ? "dash__navItem--active" : ""}`}
								onClick={() => setSidebarOpen(false)}
							>
								<span className="dash__navIcon" aria-hidden="true">
									{item.icon}
								</span>
								<span className="dash__navLabel">{item.label}</span>
							</NavLink>
						);
					})}
				</nav>
			</aside>
		);
	}, [location.pathname, sidebarOpen]);

	return (
		<div className="dash">
			<div
				className={`dash__backdrop ${sidebarOpen ? "dash__backdrop--open" : ""}`}
				onClick={() => setSidebarOpen(false)}
				aria-hidden={!sidebarOpen}
			/>

			{sidebar}

			<div className="dash__main">
				<header className="dash__header">
					<div className="dash__headerLeft">
						<button
							className="dash__burger"
							type="button"
							aria-label="Abrir menú"
							onClick={() => setSidebarOpen((v) => !v)}
						>
							<span className="dash__burgerLine" />
							<span className="dash__burgerLine" />
							<span className="dash__burgerLine" />
						</button>

						<div className="dash__headerTitle">
							<span className="dash__headerName">Contabilidad PYMES</span>
						</div>
					</div>

					<div className="dash__headerRight">
						<div className="dash__user">
							<div className="dash__userText">
								<div className="dash__userName">Administrador</div>
								<div className="dash__userRole">Acceso completo</div>
							</div>
							<div className="dash__avatar" aria-hidden="true">
								A
							</div>
						</div>

						<SecondaryButton className="dash__logout" type="button">
							Cerrar sesión
						</SecondaryButton>
					</div>
				</header>

				<main className="dash__content">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

