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
import ProtectedRoute from "./components/synapsia/ProtectedRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

// Si el usuario solo tiene rol 'administrativo' (sin admin/recepcion/especialista),
// lo redirigimos a la zona administrativa en lugar de Recepción.
const ReceptionOrAdminHome = () => {
  const { roles, hasRole, loading } = useAuth();
  if (loading) return null;
  const isOperational = hasRole("admin") || hasRole("recepcion") || hasRole("especialista");
  if (!isOperational && roles.includes("administrativo")) {
    return <Navigate to="/synapsia/admin" replace />;
  }
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
            <Route
              path="/synapsia"
              element={
                <ProtectedRoute>
                  <ReceptionOrAdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/synapsia/admin"
              element={
                <ProtectedRoute requiredRole={["admin", "administrativo"]}>
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/synapsia/cotizador"
              element={
                <ProtectedRoute requiredRole={["admin", "administrativo"]}>
                  <Cotizador />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
