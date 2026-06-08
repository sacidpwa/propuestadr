import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, FileText, LogOut, Users, Wallet, Stethoscope, Calculator, ShieldCheck, LayoutDashboard, ClipboardList } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function OwnerHome() {
  const { user, signOut, hasRole } = useAuth();
  const { toast } = useToast();
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");

  const isSpecialist = hasRole("especialista");

  const setMyPin = async () => {
    if (!/^[0-9]{4,8}$/.test(pin)) {
      toast({ variant: "destructive", title: "PIN inválido", description: "4 a 8 dígitos." });
      return;
    }
    const { error } = await supabase.rpc("set_my_pin", { _pin: pin });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "PIN actualizado" }); setPinOpen(false); setPin(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={synapsiaIcon} alt="" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold">Synapsia · Panel del Dueño</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={pinOpen} onOpenChange={setPinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><ShieldCheck className="w-4 h-4 mr-1" /> Mi PIN</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Mi PIN de seguridad</DialogTitle><DialogDescription>4 a 8 dígitos numéricos. Se usa para confirmar acciones sensibles.</DialogDescription></DialogHeader>
                <div className="space-y-2"><Label>Nuevo PIN</Label><Input inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.5em]" /></div>
                <DialogFooter><Button variant="outline" onClick={() => setPinOpen(false)}>Cancelar</Button><Button onClick={setMyPin} disabled={pin.length < 4}>Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vista global</h2>
          <p className="text-sm text-muted-foreground mt-1">Métricas, finanzas y gestión de tu equipo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tool to="/synapsia/floor" icon={<LayoutDashboard className="w-6 h-6 text-primary" />} title="Planta en vivo" desc="Canvas editable con consultorios, recepción y flujo de pacientes en tiempo real." />
          <Tool to="/synapsia/metrics" icon={<BarChart3 className="w-6 h-6 text-primary" />} title="Métricas y desempeño" desc="KPIs globales, por especialista, tendencias y reparto entre socios." />
          <Tool to="/synapsia/users" icon={<Users className="w-6 h-6 text-primary" />} title="Usuarios y roles" desc="Crear cuentas, asignar roles, PIN de seguridad y vincular especialistas." />
          <Tool to="/synapsia/expenses" icon={<Wallet className="w-6 h-6 text-primary" />} title="Gastos y reporte" desc="Registra gastos fijos y revisa estado de resultados por socio." />
          <Tool to="/synapsia/calendar" icon={<Calendar className="w-6 h-6 text-primary" />} title="Agenda" desc="Vista global del calendario de citas." />
          <Tool to="/synapsia/patients" icon={<Stethoscope className="w-6 h-6 text-primary" />} title="Pacientes y expedientes" desc="Explora todos los expedientes médicos digitales." />
          <Tool to="/synapsia/cotizador" icon={<Calculator className="w-6 h-6 text-primary" />} title="Cotizador" desc="Genera cotizaciones para Senior Living y Centro Benesse." />
          {isSpecialist && (
            <Tool to="/synapsia/calendar" icon={<FileText className="w-6 h-6 text-primary" />} title="Mi consulta" desc="Tu agenda y notas como especialista." />
          )}
        </div>
      </main>
    </div>
  );
}

function Tool({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/40">
        <CardHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">{icon}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent><Button variant="outline" size="sm" className="w-full">Abrir</Button></CardContent>
      </Card>
    </Link>
  );
}
