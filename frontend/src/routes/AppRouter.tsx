import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../landing/LandingPage";
import LoginPage from "../pages/LoginPage";
import AdminRecoveryPage from "../pages/AdminRecoveryPage";
import NotFoundPage from "../pages/NotFoundPage";
import { authService } from "../services/authService";
import LoadingState from "../components/LoadingState";
import SinAcceso from "../components/SinAcceso";
import { primeraRutaPermitida, tieneModulo } from "../utils/permisos";

// Optimización: Lazy Loading
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/ClientesPage"));
const CategoriasPage = lazy(() => import("../pages/CategoriasPage"));
const ComprasPage = lazy(() => import("../pages/ComprasPage"));
const CajaPage = lazy(() => import("../pages/CajaPage"));
const InventarioPage = lazy(() => import("../pages/InventarioPage"));
const PronosticosPage = lazy(() => import("../pages/PronosticosPage"));
const PosPage = lazy(() => import("../pages/PosPage"));
const ReportesPage = lazy(() => import("../pages/ReportesPage"));
const ConfiguracionPage = lazy(() => import("../pages/ConfiguracionPage"));
const UsuariosPage = lazy(() => import("../pages/UsuariosPage"));
const ProductosPage = lazy(() => import("../pages/ProductosPage"));
const ProveedoresPage = lazy(() => import("../pages/ProveedoresPage"));
const SetupPage = lazy(() => import("../landing/SetupPage"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));

// LA NUEVA PÁGINA (Asegúrate de crear src/pages/RolesPage.tsx)
const RolesPage = lazy(() => import("../pages/RolesPage"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function ModuleGuard({ children, modulo }: { children: React.ReactNode, modulo: string }) {
  const usuario = authService.getUsuario();

  if (tieneModulo(usuario, modulo)) return <>{children}</>;

  const destino = primeraRutaPermitida(usuario);
  if (destino) return <Navigate to={destino} replace />;

  return <SinAcceso />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><LoadingState label="Cargando módulo..." /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/recover-admin" element={<AdminRecoveryPage />} />
        <Route path="/" element={<LandingPage />} />

        {/* Módulos Protegidos */}
        <Route path="/" element={<ProtectedRoute><Sidebar /></ProtectedRoute>}>
          <Route path="dashboard" element={<ModuleGuard modulo="DASHBOARD"><DashboardPage /></ModuleGuard>} />
          <Route path="clientes" element={<ModuleGuard modulo="CLIENTES"><ClientesPage /></ModuleGuard>} />
          <Route path="proveedores" element={<ModuleGuard modulo="PROVEEDORES"><ProveedoresPage /></ModuleGuard>} />
          <Route path="productos" element={<ModuleGuard modulo="PRODUCTOS"><ProductosPage /></ModuleGuard>} />
          <Route path="categorias" element={<ModuleGuard modulo="CATEGORIAS"><CategoriasPage /></ModuleGuard>} />
          <Route path="compras" element={<ModuleGuard modulo="COMPRAS"><ComprasPage /></ModuleGuard>} />
          <Route path="inventario" element={<ModuleGuard modulo="INVENTARIO"><InventarioPage /></ModuleGuard>} />
          <Route path="pronosticos" element={<ModuleGuard modulo="INVENTARIO"><PronosticosPage /></ModuleGuard>} />
          <Route path="pos" element={<ModuleGuard modulo="POS"><PosPage /></ModuleGuard>} />
          <Route path="caja" element={<ModuleGuard modulo="CAJA"><CajaPage /></ModuleGuard>} />
          <Route path="reportes" element={<ModuleGuard modulo="REPORTES"><ReportesPage /></ModuleGuard>} />

          {/* Oculta la configuración y roles solo para ADMIN para evitar auto-elevación */}
          <Route path="configuracion" element={<ModuleGuard modulo="CONFIGURACION"><ConfiguracionPage /></ModuleGuard>} />
          <Route path="usuarios" element={<ModuleGuard modulo="USUARIOS"><UsuariosPage /></ModuleGuard>} />
          <Route path="roles" element={<ModuleGuard modulo="ROLES"><RolesPage /></ModuleGuard>} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}