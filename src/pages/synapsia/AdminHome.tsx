import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, LogOut, Wallet, Users, BarChart3, ShieldCheck, Building2, ClipboardList, LayoutDashboard, CheckCircle, DollarSign } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminHome() {
  const { signOut, user, hasRole } = useAuth();
  const { toast } = useToast();
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [feeStats, setFeeStats] = useState({ activeResidents: 0, expectedMonthly: 0, collectedThisMonth: 0, overdue: 0, residents: [] as any[] });
  const [feeLoading, setFeeLoading] = useState(true);

  useEffect(() => {
    fetchFeeStats();
    const interval = setInterval(fetchFeeStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeeStats = async () => {
    try {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];

      const { data: fees, error } = await supabase
        .from("client_fees")
        .select("id, patient_name, health_unit_id, amount, next_due_date, is_active, patient_id")
        .in("health_unit_id",
          (await supabase.from("health_units").select("id").not("name", "eq", "Synapsia Consultorio").then(r =>
            (r.data || []).map(h => h.id)
          ))
        )
        .order("next_due_date");

      if (error) return;

      const activeFees = (fees || []).filter(f => f.is_active);
      const expectedMonthly = activeFees.reduce((sum, f) => sum + (f.amount || 0), 0);

      const feeIds = activeFees.map(f => f.id);
      const { data: payments } = await supabase
        .from("client_fee_payments")
        .select("fee_id, amount, paid_at")
        .in("fee_id", feeIds.length ? feeIds : ["none"])
        .gte("paid_at", firstOfMonth)
        .lte("paid_at", todayStr);

      const collectedByFee: Record<string, number> = {};
      (payments || []).forEach(p => {
        collectedByFee[p.fee_id] = (collectedByFee[p.fee_id] || 0) + (p.amount || 0);
      });

      const collectedThisMonth = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      let overdue = 0;
      const residents = activeFees.map(f => {
        const paid = collectedByFee[f.id] || 0;
        const remaining = f.amount - paid;
        if (remaining > 0 && f.next_due_date < todayStr) overdue += remaining;
        return { ...f, paid, remaining, isOverdue: remaining > 0 && f.next_due_date < todayStr };
      });

      setFeeStats({ activeResidents: activeFees.length, expectedMonthly, collectedThisMonth, overdue, residents });
    } catch (e) {
      // silent
    } finally {
      setFeeLoading(false);
    }
  };

  const setMyPin = async () => {
    if (!/^[0-9]{4,8}$/.test(pin)) { toast({ variant: "destructive", title: "PIN inválido", description: "4 a 8 dígitos." }); return; }
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
              <h1 className="text-lg font-bold text-foreground">Synapsia · Administración</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={pinOpen} onOpenChange={setPinOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><ShieldCheck className="w-4 h-4 mr-1" /> Mi PIN</Button></DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Mi PIN de seguridad</DialogTitle><DialogDescription>4 a 8 dígitos numéricos.</DialogDescription></DialogHeader>
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
          <h2 className="text-2xl font-bold tracking-tight">Herramientas administrativas</h2>
          <p className="text-sm text-muted-foreground mt-1">Selecciona la herramienta con la que quieres trabajar.</p>
        </div>

        {!feeLoading && feeStats.activeResidents > 0 && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">Seguimiento de cobranza — Residentes</CardTitle>
              </div>
              <Link to="/synapsia/unidades">
                <Button variant="outline" size="sm">Ver unidades</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{feeStats.activeResidents}</p>
                  <p className="text-xs text-muted-foreground">Residentes activos</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">${feeStats.expectedMonthly.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Esperado mensual</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">${feeStats.collectedThisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Cobrado este mes</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${feeStats.overdue > 0 ? "text-red-600" : ""}`}>${feeStats.overdue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Vencido</p>
                </div>
              </div>
              {feeStats.residents.some(r => r.isOverdue) && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Residentes con adeudo</p>
                  <div className="max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Residente</TableHead><TableHead>Monto mensual</TableHead><TableHead>Pagado</TableHead><TableHead>Vencido</TableHead><TableHead>Vencimiento</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeStats.residents.filter(r => r.isOverdue).map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.patient_name}</TableCell>
                            <TableCell>${r.amount?.toLocaleString()}</TableCell>
                            <TableCell>${r.paid?.toLocaleString()}</TableCell>
                            <TableCell className="text-red-600 font-medium">${r.remaining?.toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{r.next_due_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tool to="/synapsia/cotizador" icon={<Calculator className="w-6 h-6 text-primary" />} title="Cotizador" desc="Genera cotizaciones para Senior Living y Centro Benesse." />
          <Tool to="/synapsia/unidades" icon={<Building2 className="w-6 h-6 text-primary" />} title="Unidades de salud" desc="Aplicativos operativos por unidad: medicamentos, gastos, nómina, requisiciones." />
          <Tool to="/synapsia/expenses" icon={<Wallet className="w-6 h-6 text-primary" />} title="Gastos & Reporte de socios" desc="Registra gastos fijos y revisa el estado de resultados por socio." />
          <Tool to="/synapsia/metrics" icon={<BarChart3 className="w-6 h-6 text-primary" />} title="Mis métricas" desc="Cobros del periodo y desempeño." />
          {(hasRole("admin") || hasRole("dueno")) && (
            <Tool to="/synapsia/users" icon={<Users className="w-6 h-6 text-primary" />} title="Usuarios y socios" desc="Crear cuentas, asignar roles, PIN y vincular especialistas." />
          )}
          {(hasRole("admin") || hasRole("dueno") || hasRole("administrativo")) && (
            <Tool to="/synapsia/dashboard" icon={<LayoutDashboard className="w-6 h-6 text-primary" />} title="Dashboard ejecutivo" desc="Indicadores consolidados: requisiciones, nómina, facturas, egresos por unidad." />
          )}
          {(hasRole("admin") || hasRole("dueno") || hasRole("administrativo")) && (
            <Tool to="/synapsia/autorizaciones" icon={<CheckCircle className="w-6 h-6 text-primary" />} title="Centro de autorizaciones" desc="Autoriza requisiciones, nómina y verifica facturas con PIN desde un solo lugar." />
          )}
          {(hasRole("admin") || hasRole("dueno")) && (
            <Tool to="/synapsia/evaluaciones" icon={<ClipboardList className="w-6 h-6 text-primary" />} title="Evaluación de personal" desc="Entrevistas al brazo administrativo: qué reciben, procesan y generan." />
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
