import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../landing/LandingPage";
import LoginPage from "../pages/LoginPage";
import AdminRecoveryPage from "../pages/AdminRecoveryPage";
import NotFoundPage from "../pages/NotFoundPage";
import { authService } from "../services/authService";
import LoadingState from "../components/LoadingState"; // Asegúrate de importar tu componente de carga

// OPTIMIZACIÓN: Code Splitting (Lazy Loading) de las páginas
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const ClientesPage = lazy(() => import("../pages/ClientesPage"));
const CategoriasPage = lazy(() => import("../pages/CategoriasPage"));
const ComprasPage = lazy(() => import("../pages/ComprasPage"));
const CajaPage = lazy(() => import("../pages/CajaPage"));
const InventarioPage = lazy(() => import("../pages/InventarioPage"));
const PosPage = lazy(() => import("../pages/PosPage"));
const ReportesPage = lazy(() => import("../pages/ReportesPage"));
const ConfiguracionPage = lazy(() => import("../pages/ConfiguracionPage"));
const UsuariosPage = lazy(() => import("../pages/UsuariosPage"));
const ProductosPage = lazy(() => import("../pages/ProductosPage"));
const ProveedoresPage = lazy(() => import("../pages/ProveedoresPage"));
const SetupPage = lazy(() => import("../landing/SetupPage"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    // El Suspense muestra un estado de carga visual solo mientras descarga el "peso" de la página destino
    <Suspense fallback={<div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><LoadingState label="Cargando módulo..." /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/checkout" element={<CheckoutPage />} /> {/* Nueva ruta de pago simulado */}
        <Route path="/recover-admin" element={<AdminRecoveryPage />} />
        <Route path="/" element={<LandingPage />} />

        {/* Agrupamos todas las rutas protegidas bajo un solo layout de Sidebar para mejor rendimiento */}
        <Route path="/" element={<ProtectedRoute><Sidebar /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
