import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MainLayout from "../layouts/MainLayout";
import ClientesPage from "../pages/ClientesPage";
import CategoriasPage from "../pages/CategoriasPage";
import ComprasPage from "../pages/ComprasPage";
import DashboardPage from "../pages/DashboardPage";
import CajaPage from "../pages/CajaPage";
import InventarioPage from "../pages/InventarioPage";
import LandingPage from "../landing/LandingPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import PosPage from "../pages/PosPage";
import ReportesPage from "../pages/ReportesPage";
import ConfiguracionPage from "../pages/ConfiguracionPage";
import UsuariosPage from "../pages/UsuariosPage";
import ProductosPage from "../pages/ProductosPage";
import ProveedoresPage from "../pages/ProveedoresPage";
import { authService } from "../services/authService";

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>

      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientesPage />} />
      </Route>

      <Route
        path="/proveedores"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProveedoresPage />} />
      </Route>

      <Route
        path="/productos"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProductosPage />} />
      </Route>

      <Route
        path="/categorias"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CategoriasPage />} />
      </Route>

      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ComprasPage />} />
      </Route>

      <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InventarioPage />} />
      </Route>

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PosPage />} />
      </Route>

      <Route
        path="/caja"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CajaPage />} />
      </Route>

      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReportesPage />} />
      </Route>

      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ConfiguracionPage />} />
      </Route>

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UsuariosPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
