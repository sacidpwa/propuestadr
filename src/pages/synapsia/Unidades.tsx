import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LogOut, Building2, ChevronRight } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import NavigationDropdown from "@/components/synapsia/NavigationDropdown";

interface HealthUnit { id: string; name: string; description: string | null; is_active: boolean; }

export default function Unidades() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<HealthUnit[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from as any)("health_units").select("*").eq("is_active", true).order("name");
      setUnits((data as any) || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div><h1 className="text-lg font-bold">Unidades de salud</h1><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <NavigationDropdown />
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-base sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Building2 className="w-5 h-5 sm:w-6 sm:h-6" /> Selecciona una unidad</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Accede a los aplicativos operativos de cada centro.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {units.map((u) => (
            <Card key={u.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/synapsia/unidades/${u.id}`)}>
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm sm:text-lg mt-1 sm:mt-2 leading-tight">{u.name}</CardTitle>
                {u.description && <CardDescription className="text-xs sm:text-sm">{u.description}</CardDescription>}
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Medicamentos, gastos, ingresos, nómina, requisiciones, cobranza.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
