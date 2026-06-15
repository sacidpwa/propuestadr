import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, DollarSign, Package, Stethoscope, Building2, UserCheck, Calculator, BarChart3, ShieldCheck } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

interface UnitSummary {
  id: string; name: string; description: string;
  patientCount: number; staffCount: number;
  expenses: number; income: number; inventoryItems: number;
}

export default function DuenoDashboard() {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [totals, setTotals] = useState({ patients: 0, staff: 0, expenses: 0, income: 0 });

  useEffect(() => {
    (async () => {
      const { data: healthUnits } = await (supabase.from as any)("health_units").select("*").order("name");
      const list = (healthUnits as any[]) || [];

      const rows = await Promise.all(list.map(async (u) => {
        const [patientRes, staffRes, expenseRes, incomeRes, invRes] = await Promise.all([
          (supabase.from as any)("patients").select("id", { count: "exact", head: true }).eq("health_unit_id", u.id),
          (supabase.from as any)("employee_assignments").select("id", { count: "exact", head: true }).eq("health_unit_id", u.id),
          (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", u.id).eq("entry_type", "gasto"),
          (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", u.id).eq("entry_type", "ingreso"),
          (supabase.from as any)("medication_inventory").select("id", { count: "exact", head: true }).eq("health_unit_id", u.id),
        ]);

        const expenses = ((expenseRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
        const income = ((incomeRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

        return {
          id: u.id, name: u.name, description: u.description || "",
          patientCount: patientRes.count || 0,
          staffCount: staffRes.count || 0,
          expenses, income,
          inventoryItems: invRes.count || 0,
        };
      }));

      setUnits(rows);
      setTotals({
        patients: rows.reduce((s, r) => s + r.patientCount, 0),
        staff: rows.reduce((s, r) => s + r.staffCount, 0),
        expenses: rows.reduce((s, r) => s + r.expenses, 0),
        income: rows.reduce((s, r) => s + r.income, 0),
      });
    })();
  }, []);

  const isSpecialist = hasRole("especialista");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Panel del Dueño</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSpecialist && (
              <Button variant="outline" size="sm" onClick={() => navigate("/synapsia/calendar")}>
                <Stethoscope className="w-4 h-4 mr-1" /> Perfil Especialista
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPIs globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Centros</p><p className="text-xl font-bold">{units.length}</p></div></CardContent></Card>
          <Card><CardContent className="py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Pacientes</p><p className="text-xl font-bold">{totals.patients}</p></div></CardContent></Card>
          <Card><CardContent className="py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Colaboradores</p><p className="text-xl font-bold">{totals.staff}</p></div></CardContent></Card>
          <Card><CardContent className="py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-red-600" /></div><div><p className="text-xs text-muted-foreground">Balance</p><p className={`text-xl font-bold ${totals.income - totals.expenses >= 0 ? "text-green-700" : "text-red-700"}`}>${(totals.income - totals.expenses).toLocaleString()}</p></div></CardContent></Card>
        </div>

        {/* Accesos directos */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/synapsia/cotizador")}>
            <Calculator className="w-4 h-4 mr-1" /> Cotizador
          </Button>
          <Button variant="outline" onClick={() => navigate("/synapsia/dashboard")}>
            <BarChart3 className="w-4 h-4 mr-1" /> Dashboard ejecutivo
          </Button>
          <Button variant="outline" onClick={() => navigate("/synapsia/autorizaciones")}>
            <ShieldCheck className="w-4 h-4 mr-1" /> Autorizaciones
          </Button>
          <Button variant="outline" onClick={() => navigate("/synapsia/patients")}>
            <Stethoscope className="w-4 h-4 mr-1" /> Pacientes
          </Button>
          <Button variant="outline" onClick={() => navigate("/synapsia/unidades")}>
            <Building2 className="w-4 h-4 mr-1" /> Unidades
          </Button>
        </div>

        {/* Tarjetas de cada centro */}
        <div className="grid md:grid-cols-2 gap-4">
          {units.map((u) => (
            <Card key={u.id} className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all" onClick={() => navigate(`/synapsia/unidades/${u.id}/dashboard`)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{u.name}</CardTitle>
                {u.description && <p className="text-xs text-muted-foreground">{u.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><span><strong>{u.patientCount}</strong> pacientes</span></div>
                  <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-muted-foreground" /><span><strong>{u.staffCount}</strong> colaboradores</span></div>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-red-500" /><span className="text-red-700"><strong>${u.expenses.toLocaleString()}</strong> gastos</span></div>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-green-700"><strong>${u.income.toLocaleString()}</strong> ingresos</span></div>
                  <div className="flex items-center gap-2 col-span-2"><Package className="w-4 h-4 text-muted-foreground" /><span><strong>{u.inventoryItems}</strong> artículos en inventario</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">Ver dashboard completo</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
