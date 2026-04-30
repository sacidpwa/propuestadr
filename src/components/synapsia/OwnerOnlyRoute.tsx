import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const OWNER_EMAIL = "sacid0221@gmail.com";

export default function OwnerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  if (user.email?.toLowerCase() !== OWNER_EMAIL) {
    return <Navigate to="/synapsia" replace />;
  }

  return <>{children}</>;
}
