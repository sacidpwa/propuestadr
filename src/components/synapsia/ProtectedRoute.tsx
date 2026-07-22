import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Un solo rol o lista de roles permitidos. Admin siempre tiene acceso. */
  requiredRole?: string | string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/synapsia/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const ok = allowed.some((r) => hasRole(r)) || hasRole("admin");
    if (!ok) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
