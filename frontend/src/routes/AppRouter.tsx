import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MainLayout from "../layouts/MainLayout";
import ClientesPage from "../pages/ClientesPage";
import CategoriasPage from "../pages/CategoriasPage";
import ComprasPage from "../pages/ComprasPage";
import DashboardPage from "../pages/DashboardPage";
import CajaPage from "../pages/CajaPage";
import InventarioPage from "../pages/InventarioPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import PosPage from "../pages/PosPage";
import ReportesPage from "../pages/ReportesPage";
import ConfiguracionPage from "../pages/ConfiguracionPage";
import UsuariosPage from "../pages/UsuariosPage";
import ProductosPage from "../pages/ProductosPage";
import ProveedoresPage from "../pages/ProveedoresPage";

export default function AppRouter() {
	return (
		<Routes>
			<Route path="/" element={<LoginPage />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/dashboard" element={<DashboardLayout />}>
				<Route index element={<DashboardPage />} />
			</Route>
			<Route path="/clientes" element={<DashboardLayout />}>
				<Route index element={<ClientesPage />} />
			</Route>
			<Route path="/proveedores" element={<DashboardLayout />}>
				<Route index element={<ProveedoresPage />} />
			</Route>
			<Route path="/productos" element={<DashboardLayout />}>
				<Route index element={<ProductosPage />} />
			</Route>
			<Route path="/categorias" element={<DashboardLayout />}>
				<Route index element={<CategoriasPage />} />
			</Route>
			<Route path="/compras" element={<DashboardLayout />}>
				<Route index element={<ComprasPage />} />
			</Route>
			<Route path="/inventario" element={<DashboardLayout />}>
				<Route index element={<InventarioPage />} />
			</Route>
			<Route path="/pos" element={<DashboardLayout />}>
				<Route index element={<PosPage />} />
			</Route>
			<Route path="/caja" element={<DashboardLayout />}>
				<Route index element={<CajaPage />} />
			</Route>
			<Route path="/reportes" element={<DashboardLayout />}>
				<Route index element={<ReportesPage />} />
			</Route>
			<Route path="/configuracion" element={<DashboardLayout />}>
				<Route index element={<ConfiguracionPage />} />
			</Route>
			<Route path="/usuarios" element={<DashboardLayout />}>
				<Route index element={<UsuariosPage />} />
			</Route>
			<Route element={<MainLayout />}>
				<Route path="/404" element={<NotFoundPage />} />
				<Route path="*" element={<Navigate to="/404" replace />} />
			</Route>
		</Routes>
	);
}
