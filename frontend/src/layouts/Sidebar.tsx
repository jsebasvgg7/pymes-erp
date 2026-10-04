import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
	LayoutDashboard,
	Users,
	Truck,
	Package,
	FolderTree,
	Warehouse,
	ShoppingCart,
	Monitor,
	Wallet,
	FileBarChart,
	UserCog,
	Settings,
	LogOut,
	ChevronsUpDown,
	ChevronDown,
	Menu,
	X,
	Search,
	Bell,
	Mail
} from "lucide-react";
import Avatar from "../components/Avatar";
import { authService } from "../services/authService";
import { empresaService } from "../services/empresaService";
import logo from "../assets/logo-black.png";
import "./Sidebar.css";

type MenuItem = {
	label: string;
	icon: typeof LayoutDashboard;
	path?: string;
};

type MenuGroup = {
	title: string;
	items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
	{
		title: "General",
		items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard }]
	},
	{
		title: "Operación",
		items: [
			{ label: "Ventas (POS)", path: "/pos", icon: Monitor },
			{ label: "Caja", path: "/caja", icon: Wallet },
			{ label: "Inventario", path: "/inventario", icon: Warehouse },
			{ label: "Compras", path: "/compras", icon: ShoppingCart }
		]
	},
	{
		title: "Catálogo",
		items: [
			{ label: "Productos", path: "/productos", icon: Package },
			{ label: "Categorías", path: "/categorias", icon: FolderTree },
			{ label: "Clientes", path: "/clientes", icon: Users },
			{ label: "Proveedores", path: "/proveedores", icon: Truck }
		]
	},
	{
		title: "Administración",
		items: [
			{ label: "Reportes", path: "/reportes", icon: FileBarChart },
			{ label: "Usuarios", path: "/usuarios", icon: UserCog },
			{ label: "Configuración", path: "/configuracion", icon: Settings }
		]
	}
];

const TOPBAR_ALERTS_ENABLED = false;

function getRoleLabel(roles?: Array<{ nombre: string }>) {
	if (!roles || roles.length === 0) return "Sin rol asignado";
	return roles.map((r) => r.nombre).join(" · ");
}

export default function Sidebar() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [nombreEmpresa, setNombreEmpresa] = useState<string | null>(null);
	const location = useLocation();
	const navigate = useNavigate();

	const usuario = useMemo(() => authService.getUsuario(), []);

	useEffect(() => {
		if (!usuario?.empresaId) return;
		let activo = true;
		empresaService
			.obtenerPorId(usuario.empresaId)
			.then((empresa) => {
				if (activo) setNombreEmpresa(empresa.nombre);
			})
			.catch(() => {
				if (activo) setNombreEmpresa(null);
			});
		return () => {
			activo = false;
		};
	}, [usuario?.empresaId]);

	const breadcrumb = useMemo(() => {
		for (const group of menuGroups) {
			const active = group.items.find(
				(item) => item.path && location.pathname.startsWith(item.path)
			);
			if (active) return { groupTitle: group.title, pageTitle: active.label };
		}
		return { groupTitle: "General", pageTitle: "Dashboard" };
	}, [location.pathname]);

	function handleLogout() {
		authService.logout();
		navigate("/login", { replace: true });
	}

	const sidebar = (
		<aside className={`dash__sidebar ${sidebarOpen ? "dash__sidebar--open" : ""}`}>
			<div className="dash__sidebarHeader">
				<div className="dash__brandCard">
					<div className="dash__brand">
						<div className="dash__brandMark" aria-hidden="true">
							<img src={logo} alt="" className="dash__brandLogo" />
						</div>
						<div className="dash__brandText">
							<div className="dash__brandCaption">ERP</div>
							<div className="dash__brandTitle">{nombreEmpresa ?? "Tu Negocio"}</div>
						</div>
					</div>

					<ChevronsUpDown size={15} className="dash__brandCaret" aria-hidden="true" />
				</div>

				<button
					className="dash__sidebarClose"
					type="button"
					aria-label="Cerrar menú"
					onClick={() => setSidebarOpen(false)}
				>
					<X size={18} />
				</button>
			</div>

			<nav className="dash__nav" aria-label="Menú principal">
				{menuGroups.map((group) => (
					<div className="dash__navGroup" key={group.title}>
						<div className="dash__navGroupTitle">{group.title}</div>

						{group.items.map((item) => {
							const isActive = item.path ? location.pathname.startsWith(item.path) : false;
							const ItemIcon = item.icon;

							if (!item.path) {
								return (
									<button key={item.label} type="button" className="dash__navItem" disabled>
										<span className="dash__navIcon" aria-hidden="true">
											<ItemIcon size={16} strokeWidth={1.8} />
										</span>
										<span className="dash__navLabel">{item.label}</span>
										<span className="dash__navBadge">Pronto</span>
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
										<ItemIcon size={16} strokeWidth={1.8} />
									</span>
									<span className="dash__navLabel">{item.label}</span>
								</NavLink>
							);
						})}
					</div>
				))}
			</nav>

			<div className="dash__sidebarFooter">
				<button className="dash__userCard" type="button" aria-label="Opciones de cuenta">
					<div className="dash__avatar">
						<Avatar
							name={usuario?.username ?? ""}
							size={64}
							className="dash__avatarImg"
							fallbackClassName="dash__avatarFallback"
						/>
						<span className="dash__avatarDot" aria-hidden="true" />
					</div>
					<div className="dash__userText">
						<div className="dash__userName">{usuario?.username ?? "Usuario"}</div>
						<div className="dash__userRole">{getRoleLabel(usuario?.roles)}</div>
					</div>
					<ChevronsUpDown size={15} className="dash__userCaret" aria-hidden="true" />
				</button>
			</div>
		</aside>
	);

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
							<Menu size={18} strokeWidth={1.8} />
						</button>

						<div className="dash__breadcrumb">
							<span className="dash__breadcrumbRoot">{breadcrumb.groupTitle}</span>
							<ChevronDown size={13} className="dash__breadcrumbSep" style={{ transform: "rotate(-90deg)" }} aria-hidden="true" />
							<span className="dash__breadcrumbCurrent">{breadcrumb.pageTitle}</span>
						</div>
					</div>

					<div className="dash__headerRight">
						<div className="ui-search dash__headerSearch">
							<Search size={16} className="ui-search__icon" aria-hidden="true" />
							<input className="ui-search__input" placeholder="Buscar..." disabled />
						</div>

						<button
							type="button"
							className={`dash__iconBtn ${TOPBAR_ALERTS_ENABLED ? "" : "dash__iconBtn--hidden"}`}
							aria-label="Notificaciones"
						>
							<Bell size={17} strokeWidth={1.8} />
						</button>

						<button
							type="button"
							className={`dash__iconBtn ${TOPBAR_ALERTS_ENABLED ? "" : "dash__iconBtn--hidden"}`}
							aria-label="Mensajes"
						>
							<Mail size={17} strokeWidth={1.8} />
						</button>

						<button
							type="button"
							className="dash__iconBtn dash__iconBtn--logout"
							aria-label="Cerrar sesión"
							onClick={handleLogout}
						>
							<LogOut size={17} strokeWidth={1.8} />
						</button>

						<div className="dash__headerAvatar">
							<Avatar
								name={usuario?.username ?? ""}
								size={72}
								className="dash__headerAvatarImg"
								fallbackClassName="dash__headerAvatarFallback"
							/>
						</div>
					</div>
				</header>

				<main className="dash__content">
					<Outlet />
				</main>
			</div>
		</div>
	);
}