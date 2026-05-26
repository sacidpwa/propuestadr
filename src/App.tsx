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
import ProtectedRoute from "./components/synapsia/ProtectedRoute";
import OwnerOnlyRoute from "./components/synapsia/OwnerOnlyRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const SynapsiaHome = () => {
  const { hasRole, loading } = useAuth();
  if (loading) return null;
  // Dueño, admin y recepción aterrizan en la Planta en vivo (canvas central)
  if (hasRole("dueno") || hasRole("admin") || hasRole("recepcion")) {
    return <Navigate to="/synapsia/floor" replace />;
  }
  if (hasRole("especialista")) return <SpecialistHome />;
  if (hasRole("administrativo")) return <Navigate to="/synapsia/admin" replace />;
  if (hasRole("promotor")) return <Navigate to="/synapsia/cotizador" replace />;
  if (hasRole("enfermera") || hasRole("intendencia") || hasRole("mantenimiento") || hasRole("asistente_admin") || hasRole("contador") || hasRole("rrhh")) {
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
            <Route path="/" element={<SynapsiaLogin />} />
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
            <Route path="/synapsia/unidades/:id/enfermeria" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "enfermera", "especialista"]}><Enfermeria /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/requisiciones/:type" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"]}><Requisiciones /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/gastos" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "asistente_admin"]}><GastosUnidad /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/facturas" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "contador"]}><Facturas /></ProtectedRoute>} />
            <Route path="/synapsia/unidades/:id/cartera" element={<ProtectedRoute requiredRole={["admin", "dueno", "administrativo", "contador"]}><Cartera /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
