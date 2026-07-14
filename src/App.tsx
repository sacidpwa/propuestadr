import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Contratos from "./pages/Contratos";
import NotFound from "./pages/NotFound";
import SynapsiaLogin from "./pages/synapsia/Login";
import Reception from "./pages/synapsia/Reception";
import Cotizador from "./pages/synapsia/Cotizador";
import AdminHome from "./pages/synapsia/AdminHome";
import OwnerHome from "./pages/synapsia/OwnerHome";
import SpecialistHome from "./pages/synapsia/SpecialistHome";
import ProfileSelector from "./pages/synapsia/ProfileSelector";
import DuenoDashboard from "./pages/synapsia/DuenoDashboard";
import DuenoUnidadDashboard from "./pages/synapsia/DuenoUnidadDashboard";
import CalendarPage from "./pages/synapsia/Calendar";
import Patients from "./pages/synapsia/Patients";
import MedicalRecord from "./pages/synapsia/MedicalRecord";
import Expenses from "./pages/synapsia/Expenses";
import UsersAdmin from "./pages/synapsia/UsersAdmin";
import Metrics from "./pages/synapsia/Metrics";
import FloorPlan from "./pages/synapsia/FloorPlan";
import Unidades from "./pages/synapsia/Unidades";
import UnidadDetalle from "./pages/synapsia/UnidadDetalle";
import Enfermeria from "./pages/synapsia/Enfermeria";
import Requisiciones from "./pages/synapsia/Requisiciones";
import GastosUnidad from "./pages/synapsia/GastosUnidad";
import Facturas from "./pages/synapsia/Facturas";
import Cartera from "./pages/synapsia/Cartera";
import Nomina from "./pages/synapsia/Nomina";
import Evaluaciones from "./pages/synapsia/Evaluaciones";
import DashboardEjecutivo from "./pages/synapsia/DashboardEjecutivo";
import CentroAutorizaciones from "./pages/synapsia/CentroAutorizaciones";
import OrdenesCompra from "./pages/synapsia/OrdenesCompra";
import Inventario from "./pages/synapsia/Inventario";
import ConfirmacionInventario from "./pages/synapsia/ConfirmacionInventario";
import ServicePrices from "./pages/synapsia/ServicePrices";
import PlantillaLaboral from "./pages/synapsia/PlantillaLaboral";
import LogMovimientos from "./pages/synapsia/LogMovimientos";
import AsistenteAdminHome from "./pages/synapsia/AsistenteAdminHome";
import RegistroPaciente from "./pages/synapsia/RegistroPaciente";
import DetallePaciente from "./pages/synapsia/DetallePaciente";
import DiarioPacientes from "./pages/synapsia/DiarioPacientes";
import CajaChica from "./pages/synapsia/CajaChica";
import GoogleCallback from "./pages/synapsia/GoogleCallback";
import PrivacyPolicy from "./pages/synapsia/PrivacyPolicy";
import TermsOfService from "./pages/synapsia/TermsOfService";
import LandingPage from "./pages/synapsia/LandingPage";
import ProtectedRoute from "./components/synapsia/ProtectedRoute";
import OwnerOnlyRoute from "./components/synapsia/OwnerOnlyRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const SynapsiaHome = () => {
  const { hasRole, user, loading } = useAuth();
  if (loading) return null;
  if (user?.email?.toLowerCase() === "esther.z@synapsia.mx") {
    return <Navigate to="/synapsia/dashboard" replace />;
  }
  // Si es dueño (con o sin especialista), mostrar selector de perfil
  if (hasRole("dueno")) {
    return <ProfileSelector />;
  }
  // Admin y recepción aterrizan en la Planta en vivo (canvas central)
  if (hasRole("admin") || hasRole("recepcion")) {
    return <Navigate to="/synapsia/floor" replace />;
  }
  if (hasRole("especialista")) return <SpecialistHome />;
  if (hasRole("administrativo")) return <Navigate to="/synapsia/admin" replace />;
  if (hasRole("promotor")) return <Navigate to="/synapsia/cotizador" replace />;
  if (hasRole("asistente_admin")) {
    return <Navigate to="/synapsia/asistente-admin" replace />;
  }
  if (hasRole("enfermera") || hasRole("intendencia") || hasRole("mantenimiento") || hasRole("contador") || hasRole("rrhh")) {
    return <Navigate to="/synapsia/unidades" replace />;
  }
  return <Navigate to="/synapsia/floor" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/propuesta" element={<OwnerOnlyRoute><Index /></OwnerOnlyRoute>} />
            <Route path="/contratos" element={<OwnerOnlyRoute><Contratos /></OwnerOnlyRoute>} />
            <Route path="/synapsia/login" element={<SynapsiaLogin />} />
            <Route path="/synapsia" element={<ProtectedRoute><SynapsiaHome /></ProtectedRoute>} />
            <Route path="/synapsia/admin" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo"]}><AdminHome /></ProtectedRoute>} />
            <Route path="/synapsia/cotizador" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "promotor"]}><Cotizador /></ProtectedRoute>} />
            <Route path="/synapsia/calendar" element={<ProtectedRoute requiredRole={["admin", "dueno", "recepcion", "especialista"]}><CalendarPage /></ProtectedRoute>} />
            <Route path="/synapsia/patients" element={<ProtectedRoute requiredRole={["admin", "dueno", "recepcion", "especialista"]}><Patients /></ProtectedRoute>} />
            <Route path="/synapsia/records/:patientId" element={<ProtectedRoute requiredRole={["admin", "dueno", "especialista"]}><MedicalRecord /></ProtectedRoute>} />
            <Route path="/synapsia/expenses" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo"]}><Expenses /></ProtectedRoute>} />
            <Route path="/synapsia/users" element={<ProtectedRoute requiredRole={["admin", "dueno", "recepcion"]}><UsersAdmin /></ProtectedRoute>} />
            <Route path="/synapsia/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
            <Route path="/synapsia/floor" element={<ProtectedRoute requiredRole={["admin", "dueno", "recepcion"]}><FloorPlan /></ProtectedRoute>} />
            <Route path="/synapsia/unidades" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh", "enfermera", "intendencia", "mantenimiento"]}><Unidades /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh", "enfermera", "intendencia", "mantenimiento"]}><UnidadDetalle /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/registro-paciente" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "recepcion", "enfermera", "especialista"]}><RegistroPaciente /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:unitId/paciente/:patientId" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "recepcion", "enfermera", "especialista"]}><DetallePaciente /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/enfermeria" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"]}><Enfermeria /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/requisiciones/:type" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"]}><Requisiciones /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/gastos" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin"]}><GastosUnidad /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/diario" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "recepcion"]}><DiarioPacientes /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/caja-chica" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "contador"]}><CajaChica /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/facturas" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "contador"]}><Facturas /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/cartera" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "contador"]}><Cartera /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/nomina" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh"]}><Nomina /></ProtectedRoute>} />
            <Route path="/synapsia/plantilla" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh"]}><PlantillaLaboral /></ProtectedRoute>} />
            <Route path="/synapsia/evaluaciones" element={<ProtectedRoute requiredRole={["admin", "dueno"]}><Evaluaciones /></ProtectedRoute>} />
            <Route path="/synapsia/dashboard" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo"]}><DashboardEjecutivo /></ProtectedRoute>} />
            <Route path="/synapsia/autorizaciones" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin"]}><CentroAutorizaciones /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/ordenes-compra" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin"]}><OrdenesCompra /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/inventario" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "enfermera"]}><Inventario /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/confirmar-inventario" element={<ProtectedRoute requiredRole={["admin", "dueno", "enfermera"]}><ConfirmacionInventario /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/precios" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "contador", "enfermera"]}><ServicePrices /></ProtectedRoute>} />
            <Route path="/synapsia/log-movimientos" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo"]}><LogMovimientos /></ProtectedRoute>} />
            <Route path="/synapsia/asistente-admin" element={<ProtectedRoute requiredRole={["admin", "dueno", "asistente_admin"]}><AsistenteAdminHome /></ProtectedRoute>} />
            <Route path="/synapsia/elegir-perfil" element={<ProtectedRoute><ProfileSelector /></ProtectedRoute>} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/synapsia/dueno" element={<ProtectedRoute requiredRole={["admin", "dueno"]}><DuenoDashboard /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/dashboard" element={<ProtectedRoute requiredRole={["admin", "dueno"]}><DuenoUnidadDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
