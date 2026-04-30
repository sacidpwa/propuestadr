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
import SpecialistHome from "./pages/synapsia/SpecialistHome";
import CalendarPage from "./pages/synapsia/Calendar";
import Patients from "./pages/synapsia/Patients";
import MedicalRecord from "./pages/synapsia/MedicalRecord";
import Expenses from "./pages/synapsia/Expenses";
import UsersAdmin from "./pages/synapsia/UsersAdmin";
import ProtectedRoute from "./components/synapsia/ProtectedRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const SynapsiaHome = () => {
  const { roles, hasRole, loading } = useAuth();
  if (loading) return null;
  if (hasRole("admin") || hasRole("recepcion")) return <Reception />;
  if (hasRole("especialista")) return <SpecialistHome />;
  if (roles.includes("administrativo")) return <Navigate to="/synapsia/admin" replace />;
  return <Reception />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/synapsia/login" element={<SynapsiaLogin />} />
            <Route path="/synapsia" element={<ProtectedRoute><SynapsiaHome /></ProtectedRoute>} />
            <Route path="/synapsia/admin" element={<ProtectedRoute requiredRole={["admin", "administrativo"]}><AdminHome /></ProtectedRoute>} />
            <Route path="/synapsia/cotizador" element={<ProtectedRoute requiredRole={["admin", "administrativo"]}><Cotizador /></ProtectedRoute>} />
            <Route path="/synapsia/calendar" element={<ProtectedRoute requiredRole={["admin", "recepcion", "especialista"]}><CalendarPage /></ProtectedRoute>} />
            <Route path="/synapsia/patients" element={<ProtectedRoute requiredRole={["admin", "recepcion", "especialista"]}><Patients /></ProtectedRoute>} />
            <Route path="/synapsia/records/:patientId" element={<ProtectedRoute requiredRole={["admin", "especialista"]}><MedicalRecord /></ProtectedRoute>} />
            <Route path="/synapsia/expenses" element={<ProtectedRoute requiredRole={["admin", "administrativo"]}><Expenses /></ProtectedRoute>} />
            <Route path="/synapsia/users" element={<ProtectedRoute requiredRole={["admin"]}><UsersAdmin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
