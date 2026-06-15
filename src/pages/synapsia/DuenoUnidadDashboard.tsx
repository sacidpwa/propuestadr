import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, LogOut, Users, DollarSign, Package, ShoppingCart, ClipboardList,
  FileText, Building2, UserCheck, Wallet, TrendingUp, TrendingDown, Stethoscope,
} from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DuenoUnidadDashboard() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [data, setData] = useState({
    patients: 0, staff: 0, expenses: 0, income: 0,
    inventoryItems: 0, pendingRequisitions: 0,
    activePOs: 0, recentExpenses: [] as any[],
  });

  const isSpecialist = hasRole("especialista");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const [unitRes, patientRes, staffRes, expenseRes, incomeRes, invRes, reqRes, poRes] = await Promise.all([
        (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle(),
        (supabase.from as any)("patients").select("id", { count: "exact", head: true }).eq("health_unit_id", unitId),
        (supabase.from as any)("employee_assignments").select("id", { count: "exact", head: true }).eq("health_unit_id", unitId),
        (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", unitId).eq("entry_type", "gasto"),
        (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", unitId).eq("entry_type", "ingreso"),
        (supabase.from as any)("medication_inventory").select("id", { count: "exact", head: true }).eq("health_unit_id", unitId),
        (supabase.from as any)("requisitions").select("id", { count: "exact", head: true }).eq("health_unit_id", unitId).in("status", ["pendiente", "autorizada"]),
        (supabase.from as any)("purchase_orders").select("id", { count: "exact", head: true }).eq("health_unit_id", unitId).in("status", ["pendiente", "autorizada", "comprada"]),
      ]);

      const expenses = ((expenseRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const income = ((incomeRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      setUnitName((unitRes as any)?.name ?? "");

      const { data: recent } = await (supabase.from as any)("expense_entries")
        .select("*").eq("health_unit_id", unitId).order("created_at", { ascending: false }).limit(5);

      setData({
        patients: patientRes.count || 0,
        staff: staffRes.count || 0,
        expenses, income,
        inventoryItems: invRes.count || 0,
        pendingRequisitions: reqRes.count || 0,
        activePOs: poRes.count || 0,
        recentExpenses: (recent as any[]) || [],
      });
    })();
  }, [unitId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/dueno")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{unitName}</h1>
              <p className="text-xs text-muted-foreground">Dashboard del centro</p>
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
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Pacientes</p><p className="text-xl font-bold">{data.patients}</p></div></div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Plantilla</p><p className="text-xl font-bold">{data.staff}</p></div></div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div><div><p className="text-xs text-muted-foreground">Gastos</p><p className="text-xl font-bold text-red-700">${data.expenses.toLocaleString()}</p></div></div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Ingresos</p><p className="text-xl font-bold text-green-700">${data.income.toLocaleString()}</p></div></div></CardContent></Card>
        </div>

        {/* Segunda fila */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><Package className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Inventario</p><p className="text-lg font-bold">{data.inventoryItems} artículos</p></div></div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><ClipboardList className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Requisiciones activas</p><p className="text-lg font-bold">{data.pendingRequisitions}</p></div></div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">OC pendientes</p><p className="text-lg font-bold">{data.activePOs}</p></div></div></CardContent></Card>
        </div>

        {/* Acceso rápido a herramientas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Herramientas de gestión</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}/gastos`)}><Wallet className="w-4 h-4 mr-1" /> Gastos</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}/inventario`)}><Package className="w-4 h-4 mr-1" /> Inventario</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}/requisiciones/medicamentos`)}><ClipboardList className="w-4 h-4 mr-1" /> Requisiciones</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}/ordenes-compra`)}><ShoppingCart className="w-4 h-4 mr-1" /> Órdenes de compra</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}/nomina`)}><FileText className="w-4 h-4 mr-1" /> Nómina</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><Building2 className="w-4 h-4 mr-1" /> Panel general</Button>
          </CardContent>
        </Card>

        {/* Gastos recientes */}
        {data.recentExpenses.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Gastos recientes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentExpenses.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium truncate max-w-[250px]">{e.description}</TableCell>
                      <TableCell><Badge variant="outline" className={e.entry_type === "gasto" ? "bg-red-500/10 text-red-700" : "bg-green-500/10 text-green-700"}>{e.entry_type}</Badge></TableCell>
                      <TableCell className="text-xs">{e.expense_date ? format(new Date(e.expense_date), "PP", { locale: es }) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">${Number(e.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
