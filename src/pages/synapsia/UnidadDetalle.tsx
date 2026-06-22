import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, LineChart, Line } from "recharts";
import {
  ArrowLeft, LogOut, Menu, X, Pill, Wallet, FileText, Users, ClipboardList,
  Sparkles, Wrench, HandCoins, Receipt, ShoppingBag, ShoppingCart, Package,
  ClipboardCheck, Building2, UserCheck, TrendingUp, TrendingDown, DollarSign,
  AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HealthUnit { id: string; name: string; description: string | null; }

interface AppEntry {
  key: string; label: string; desc: string; icon: any; route: string;
  roles: string[];
}

const APPS: AppEntry[] = [
  { key: "dashboard", label: "Dashboard", desc: "KPIs y resumen operativo", icon: Building2, route: "", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh", "enfermera", "intendencia", "mantenimiento"] },
  { key: "registro-paciente", label: "Registro de paciente/residente", desc: "Datos del paciente y tutor responsable", icon: Users, route: "registro-paciente", roles: ["admin", "dueno", "administrativo", "asistente_admin", "recepcion", "enfermera", "especialista"] },
  { key: "medicamentos", label: "Control de medicamentos", desc: "Hoja por paciente (enfermería)", icon: Pill, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "menus", label: "Menús semanales", desc: "Plan alimenticio y consumo", icon: ClipboardList, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "gastos", label: "Control de flujos", desc: "Flujo de efectivo, ingresos y gastos", icon: Wallet, route: "gastos", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "ingresos", label: "Facturas de ingreso", desc: "Facturas de pacientes y verificación", icon: Receipt, route: "facturas", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "nomina", label: "Nómina", desc: "Periodos y pagos", icon: Users, route: "nomina", roles: ["admin", "dueno", "administrativo", "contador", "rrhh"] },
  { key: "plantilla", label: "Plantilla laboral", desc: "Empleados y asignación de unidades", icon: ClipboardCheck, route: "/synapsia/plantilla", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh"] },
  { key: "req-medicamentos", label: "Requisición de medicamentos", desc: "Solicitudes de insumos médicos", icon: ShoppingBag, route: "requisiciones/medicamentos", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-limpieza", label: "Requisición de limpieza", desc: "Insumos de intendencia", icon: Sparkles, route: "requisiciones/limpieza", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-mantenimiento", label: "Requisición de mantenimiento", desc: "Insumos de mantenimiento", icon: Wrench, route: "requisiciones/mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-servicio", label: "Servicios de mantenimiento", desc: "Reparaciones y servicios externos", icon: Wrench, route: "requisiciones/servicio_mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "pago-proveedores", label: "Pago a proveedores", desc: "Órdenes y verificación con PIN", icon: HandCoins, route: "requisiciones/pago_proveedor", roles: ["admin", "dueno", "administrativo", "asistente_admin", "intendencia", "mantenimiento"] },
  { key: "cobranza", label: "Cartera de clientes", desc: "Cuotas y morosos", icon: FileText, route: "cartera", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "ordenes-compra", label: "Órdenes de compra", desc: "Generar, autorizar y abastecer", icon: ShoppingCart, route: "ordenes-compra", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "inventario", label: "Inventario de medicamentos", desc: "Stock, entradas, alertas de mínimo", icon: Package, route: "inventario", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera"] },
  { key: "confirmar-inventario", label: "Confirmar inventario", desc: "Conteo físico cada 3 días", icon: ClipboardCheck, route: "confirmar-inventario", roles: ["admin", "dueno", "enfermera"] },
  { key: "precios", label: "Precios por servicio", desc: "Catálogo de precios de la unidad", icon: DollarSign, route: "precios", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "enfermera"] },
];

interface MonthlyEntry { month: string; ingresos: number; gastos: number; }

interface FeeOverdue { id: string; patient_name: string; amount: number; next_due_date: string; days_overdue: number; }

interface DashboardData {
  patients: number;
  staff: number;
  expenses: number;
  income: number;
  inventoryItems: number;
  pendingRequisitions: number;
  activePOs: number;
  activeFees: number;
  overdueFees: number;
  overdueAmount: number;
  monthly: MonthlyEntry[];
  overdueList: FeeOverdue[];
  recentExpenses: any[];
}

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function UnidadDetalle() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<HealthUnit | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<DashboardData>({
    patients: 0, staff: 0, expenses: 0, income: 0,
    inventoryItems: 0, pendingRequisitions: 0, activePOs: 0,
    activeFees: 0, overdueFees: 0, overdueAmount: 0,
    monthly: [], overdueList: [], recentExpenses: [],
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("*").eq("id", id).maybeSingle();
      setUnit((u as any) || null);

      const year = new Date().getFullYear();

      const [patientRes, staffRes, expenseRes, incomeRes, invRes, reqRes, poRes, feeRes, monthlyRes] = await Promise.all([
        (supabase.from as any)("patients").select("id", { count: "exact", head: true }).eq("health_unit_id", id),
        (supabase.from as any)("employee_assignments").select("id", { count: "exact", head: true }).eq("health_unit_id", id),
        (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", id).eq("entry_type", "gasto"),
        (supabase.from as any)("expense_entries").select("amount").eq("health_unit_id", id).eq("entry_type", "ingreso"),
        (supabase.from as any)("medication_inventory").select("id", { count: "exact", head: true }).eq("health_unit_id", id),
        (supabase.from as any)("requisitions").select("id", { count: "exact", head: true }).eq("health_unit_id", id).in("status", ["pendiente", "autorizada"]),
        (supabase.from as any)("purchase_orders").select("id", { count: "exact", head: true }).eq("health_unit_id", id).in("status", ["pendiente", "autorizada", "comprada"]),
        (supabase.from as any)("client_fees").select("*").eq("health_unit_id", id).eq("is_active", true),
        (supabase.from as any)("expense_entries").select("amount, entry_type, period_month").eq("health_unit_id", id).eq("period_year", year),
      ]);

      const expenses = ((expenseRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const income = ((incomeRes.data as any[]) || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      // Monthly aggregation
      const monthlyMap: Record<number, MonthlyEntry> = {};
      for (let m = 0; m < 12; m++) monthlyMap[m] = { month: MONTHS[m], ingresos: 0, gastos: 0 };
      ((monthlyRes.data as any[]) || []).forEach((e: any) => {
        const m = Number(e.period_month) - 1;
        if (monthlyMap[m]) {
          if (e.entry_type === "ingreso") monthlyMap[m].ingresos += Number(e.amount || 0);
          else monthlyMap[m].gastos += Number(e.amount || 0);
        }
      });
      const monthly = Object.values(monthlyMap);

      // Fees / cobranza
      const activeFees = (feeRes.data as any[]) || [];
      const today = new Date();
      const overdue = activeFees.filter((f: any) => f.next_due_date && new Date(f.next_due_date) < today);
      const overdueAmount = overdue.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
      const overdueList = overdue.map((f: any) => ({
        id: f.id, patient_name: f.patient_name, amount: Number(f.amount),
        next_due_date: f.next_due_date,
        days_overdue: Math.floor((today.getTime() - new Date(f.next_due_date).getTime()) / (1000 * 60 * 60 * 24)),
      })).sort((a: any, b: any) => b.days_overdue - a.days_overdue);

      const { data: recent } = await (supabase.from as any)("expense_entries")
        .select("*").eq("health_unit_id", id).order("created_at", { ascending: false }).limit(5);

      setData({
        patients: patientRes.count || 0,
        staff: staffRes.count || 0,
        expenses, income,
        inventoryItems: invRes.count || 0,
        pendingRequisitions: reqRes.count || 0,
        activePOs: poRes.count || 0,
        activeFees: activeFees.length,
        overdueFees: overdue.length,
        overdueAmount,
        monthly, overdueList,
        recentExpenses: (recent as any[]) || [],
      });
    })();
  }, [id]);

  const apps = APPS.filter(a => a.key === "dashboard" || a.roles.some(r => hasRole(r)));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shadow-sm z-10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/unidades")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:inline-flex">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{unit?.name ?? "Unidad"}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside className={`hidden md:flex flex-col border-r bg-card transition-all duration-200 ${sidebarOpen ? "w-64" : "w-14"}`}>
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-0.5 px-2">
              {apps.map(({ key, label, icon: Icon, route }) => {
                const isDashboard = key === "dashboard";
                return (
                  <button
                    key={key}
                    onClick={() => navigate(isDashboard ? `/synapsia/unidades/${id}` : route.startsWith("/") ? route : `/synapsia/unidades/${id}/${route}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isDashboard ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                    title={sidebarOpen ? undefined : label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-64 bg-card border-r shadow-xl">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-semibold text-sm">Aplicativos</span>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <nav className="space-y-0.5 p-2">
                  {apps.map(({ key, label, icon: Icon, route }) => {
                    const isDashboard = key === "dashboard";
                    return (
                      <button
                        key={key}
                        onClick={() => { setSidebarOpen(false); navigate(isDashboard ? `/synapsia/unidades/${id}` : route.startsWith("/") ? route : `/synapsia/unidades/${id}/${route}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pacientes / Residentes</p>
                      <p className="text-xl font-bold">{data.patients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Empleados</p>
                      <p className="text-xl font-bold">{data.staff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <p className="text-xl font-bold text-green-700">${data.income.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gastos</p>
                      <p className="text-xl font-bold text-red-700">${data.expenses.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica anual Ingresos vs Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Ingresos vs Gastos {new Date().getFullYear()}
                </CardTitle>
                <CardDescription>Comparativa mensual de ingresos y gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
                      <ReTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pendiente de cobro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Pendiente de cobro
                </CardTitle>
                <CardDescription>
                  {data.overdueFees > 0
                    ? `${data.overdueFees} cuota(s) vencida(s) por un total de $${data.overdueAmount.toLocaleString()}`
                    : "No hay cuotas vencidas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.overdueList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Paciente</th>
                          <th className="text-left px-4 py-2 font-medium">Monto</th>
                          <th className="text-left px-4 py-2 font-medium">Vencimiento</th>
                          <th className="text-left px-4 py-2 font-medium">Días vencido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.overdueList.map((fee) => (
                          <tr key={fee.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{fee.patient_name}</td>
                            <td className="px-4 py-2">${fee.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-xs">{format(new Date(fee.next_due_date), "PP", { locale: es })}</td>
                            <td className="px-4 py-2">
                              <Badge variant={fee.days_overdue > 30 ? "destructive" : "secondary"} className={fee.days_overdue <= 30 ? "bg-amber-500/10 text-amber-700" : ""}>
                                {fee.days_overdue} días
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <CardContent className="text-center text-muted-foreground py-8">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay cuotas vencidas</p>
                  </CardContent>
                )}
              </CardContent>
            </Card>

            {/* Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Balance financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ingresos totales</p>
                    <p className="text-2xl font-bold text-green-700">${data.income.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gastos totales</p>
                    <p className="text-2xl font-bold text-red-700">${data.expenses.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margen</p>
                    <p className={`text-2xl font-bold ${data.income - data.expenses >= 0 ? "text-green-700" : "text-red-700"}`}>
                      ${(data.income - data.expenses).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cuotas por cobrar</p>
                    <p className="text-2xl font-bold">{data.overdueAmount > 0 ? `$${data.overdueAmount.toLocaleString()}` : "$0"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos recientes */}
            {data.recentExpenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Movimientos recientes</CardTitle>
                  <CardDescription>Últimos 5 registros</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Descripción</th>
                          <th className="text-left px-4 py-2 font-medium">Tipo</th>
                          <th className="text-left px-4 py-2 font-medium">Fecha</th>
                          <th className="text-right px-4 py-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentExpenses.map((e: any) => (
                          <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium truncate max-w-[250px]">{e.description}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className={e.entry_type === "gasto" ? "bg-red-500/10 text-red-700" : "bg-green-500/10 text-green-700"}>
                                {e.entry_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-xs">
                              {e.expense_date ? format(new Date(e.expense_date), "PP", { locale: es }) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">${Number(e.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
