import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Stethoscope, LogOut, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";

export default function ProfileSelector() {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const isOwner = hasRole("dueno");
  const isSpecialist = hasRole("especialista");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <img src={synapsiaIcon} alt="" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Selecciona tu perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>

        <div className="grid gap-4">
          {isOwner && (
            <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => navigate("/synapsia/dueno")}>
              <CardHeader className="pb-2">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
                  <UserCog className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Dueño / Propietario</CardTitle>
                <CardDescription>
                  Dashboard general de todos los centros. KPIs financieros, pacientes, inventario y más.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Entrar como Dueño</Button>
              </CardContent>
            </Card>
          )}

          {isSpecialist && (
            <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => navigate("/synapsia/calendar")}>
              <CardHeader className="pb-2">
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Especialista</CardTitle>
                <CardDescription>
                  Agenda de citas, expedientes médicos, pacientes y métricas de consulta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Entrar como Especialista</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/synapsia/floor")}>
            <Building2 className="w-4 h-4 mr-1" /> Ir a herramientas generales
          </Button>
          <div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
