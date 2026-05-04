import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, TrendingUp, DollarSign, Users, Activity, Wallet, AlertCircle } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Visit {
  id: string; specialist_id: string; arrival_time: string; status: string; receptionist_id: string | null;
  patient_id: string;
}
interface Payment { id: string; visit_id: string; amount: number; payment_method: string; collected_by: string | null; created_at: string; }
interface Specialist { id: string; full_name: string; consultation_fee: number; is_partner: boolean; is_active: boolean; user_id: string | null; }
interface ExpenseEntry { id: string; amount: number; period_year: number; period_month: number; expense_date: string; description: string; }

const COLORS = ["hsl(220 40% 30%)", "hsl(40 70% 55%)", "hsl(160 50% 40%)", "hsl(0 60% 55%)", "hsl(260 40% 50%)", "hsl(190 60% 45%)"];

export default function Metrics() {
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();
  const [params] = useSearchParams();
  const focusedUserId = params.get("user");

  const [period, setPeriod] = useState<"month" | "ytd" | "all">("month");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string; email: string | null }[]>([]);

  const isOwner = hasRole("admin") || hasRole("dueno");

  useEffect(() => { fetchAll(); }, [period]);

  const fetchAll = async () => {
    const now = new Date();
    let from: Date | null = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "ytd") from = new Date(now.getFullYear(), 0, 1);
    if (period === "all") from = null;
    const fromIso = from?.toISOString();

    const visitsQ = supabase.from("visits").select("id, specialist_id, arrival_time, status, receptionist_id, patient_id").order("arrival_time", { ascending: true });
    const paymentsQ = supabase.from("payments").select("id, visit_id, amount, payment_method, collected_by, created_at").order("created_at", { ascending: true });
    const expensesQ = supabase.from("expense_entries").select("id, amount, period_year, period_month, expense_date, description");

    const [{ data: v }, { data: pmt }, { data: s }, { data: e }, { data: pr }] = await Promise.all([
      fromIso ? visitsQ.gte("arrival_time", fromIso) : visitsQ,
      fromIso ? paymentsQ.gte("created_at", fromIso) : paymentsQ,
      supabase.from("specialists").select("id, full_name, consultation_fee, is_partner, is_active, user_id").order("full_name"),
      expensesQ,
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    setVisits((v as any) || []);
    setPayments((pmt as any) || []);
    setSpecialists((s as any) || []);
    setExpenses((e as any) || []);
    setProfiles((pr as any) || []);
  };

  // Map visit -> specialist; payment -> visit
  const visitById = useMemo(() => Object.fromEntries(visits.map((v) => [v.id, v])), [visits]);
  const specialistById = useMemo(() => Object.fromEntries(specialists.map((s) => [s.id, s])), [specialists]);

  // Aggregations per specialist
  const perSpecialist = useMemo(() => {
    const acc: Record<string, { id: string; name: string; consultas: number; ingresos: number; pacientes: Set<string>; ticket: number; }> = {};
    specialists.forEach((s) => { acc[s.id] = { id: s.id, name: s.full_name, consultas: 0, ingresos: 0, pacientes: new Set(), ticket: 0 }; });
    visits.forEach((v) => {
      const a = acc[v.specialist_id]; if (!a) return;
      if (v.status === "atendido" || v.status === "en_consulta") {
        a.consultas++;
        a.pacientes.add(v.patient_id);
      }
    });
    payments.forEach((p) => {
      const v = visitById[p.visit_id]; if (!v) return;
      const a = acc[v.specialist_id]; if (!a) return;
      a.ingresos += Number(p.amount);
    });
    return Object.values(acc).map((a) => ({ ...a, pacientesCount: a.pacientes.size, ticket: a.consultas ? a.ingresos / a.consultas : 0 }));
  }, [visits, payments, specialists, visitById]);

  // Per receptionist (collected_by)
  const perReceptionist = useMemo(() => {
    const acc: Record<string, { id: string; name: string; cobros: number; monto: number }> = {};
    payments.forEach((p) => {
      const id = p.collected_by ?? "—";
      const name = profiles.find((pr) => pr.user_id === id)?.full_name ?? "Sin asignar";
      acc[id] = acc[id] || { id, name, cobros: 0, monto: 0 };
      acc[id].cobros++;
      acc[id].monto += Number(p.amount);
    });
    return Object.values(acc);
  }, [payments, profiles]);

  // Saldos pendientes: visitas atendidas sin pago suficiente
  const pendientes = useMemo(() => {
    const paidByVisit: Record<string, number> = {};
    payments.forEach((p) => { paidByVisit[p.visit_id] = (paidByVisit[p.visit_id] || 0) + Number(p.amount); });
    let total = 0;
    let count = 0;
    visits.forEach((v) => {
      if (v.status !== "atendido") return;
      const fee = specialistById[v.specialist_id]?.consultation_fee || 0;
      const paid = paidByVisit[v.id] || 0;
      const diff = fee - paid;
      if (diff > 0.01) { total += diff; count++; }
    });
    return { total, count };
  }, [visits, payments, specialistById]);

  const totals = useMemo(() => {
    const ingresos = payments.reduce((s, p) => s + Number(p.amount), 0);
    const consultas = visits.filter((v) => v.status === "atendido" || v.status === "en_consulta").length;
    const pacientesUnicos = new Set(visits.map((v) => v.patient_id)).size;
    const gastos = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return { ingresos, consultas, pacientesUnicos, gastos, neto: ingresos - gastos };
  }, [payments, visits, expenses]);

  // Tendencia mensual (últimos 6 meses)
  const tendencia = useMemo(() => {
    const map: Record<string, { mes: string; ingresos: number; consultas: number; gastos: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { mes: d.toLocaleDateString("es-MX", { month: "short" }), ingresos: 0, consultas: 0, gastos: 0 };
    }
    payments.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (map[key]) map[key].ingresos += Number(p.amount);
    });
    visits.forEach((v) => {
      if (v.status !== "atendido" && v.status !== "en_consulta") return;
      const d = new Date(v.arrival_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (map[key]) map[key].consultas++;
    });
    expenses.forEach((e) => {
      const key = `${e.period_year}-${String(e.period_month).padStart(2, "0")}`;
      if (map[key]) map[key].gastos += Number(e.amount);
    });
    return Object.values(map);
  }, [payments, visits, expenses]);

  const focusedSpecialist = useMemo(() => {
    if (!focusedUserId) return null;
    return specialists.find((s) => s.user_id === focusedUserId);
  }, [focusedUserId, specialists]);

  const focusedRows = useMemo(() => {
    if (!focusedSpecialist) return null;
    return perSpecialist.find((p) => p.id === focusedSpecialist.id) || null;
  }, [perSpecialist, focusedSpecialist]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Métricas y desempeño</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="ytd">Año en curso</SelectItem>
                <SelectItem value="all">Histórico</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {focusedUserId && (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> Usuario en foco: {profiles.find((p) => p.user_id === focusedUserId)?.full_name ?? focusedUserId}
              </CardTitle>
              <CardDescription>Métricas individuales {focusedSpecialist ? "como especialista" : "(sin especialista vinculado)"}.</CardDescription>
            </CardHeader>
            <CardContent>
              {focusedRows ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat icon={<Activity />} label="Consultas" value={focusedRows.consultas.toString()} />
                  <Stat icon={<DollarSign />} label="Ingresos" value={`$${focusedRows.ingresos.toLocaleString()}`} />
                  <Stat icon={<Users />} label="Pacientes únicos" value={focusedRows.pacientesCount.toString()} />
                  <Stat icon={<TrendingUp />} label="Ticket promedio" value={`$${focusedRows.ticket.toFixed(0)}`} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este usuario no está vinculado a un especialista. Solo se muestran métricas globales abajo.</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat icon={<DollarSign className="text-green-600" />} label="Ingresos" value={`$${totals.ingresos.toLocaleString()}`} />
          <Stat icon={<Activity className="text-blue-600" />} label="Consultas" value={totals.consultas.toString()} />
          <Stat icon={<Users className="text-purple-600" />} label="Pacientes" value={totals.pacientesUnicos.toString()} />
          <Stat icon={<Wallet className="text-orange-600" />} label="Gastos" value={`$${totals.gastos.toLocaleString()}`} />
          <Stat icon={<TrendingUp className="text-primary" />} label="Neto" value={`$${totals.neto.toLocaleString()}`} highlight />
        </div>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <div className="text-sm">
              <span className="font-semibold">Saldos pendientes de cobro:</span>{" "}
              <span className="font-mono">${pendientes.total.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">en {pendientes.count} consulta(s) atendida(s) sin pago completo.</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="specialists">
          <TabsList>
            <TabsTrigger value="specialists">Por especialista</TabsTrigger>
            <TabsTrigger value="reception">Recepción</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            {isOwner && <TabsTrigger value="partners">Socios</TabsTrigger>}
          </TabsList>

          <TabsContent value="specialists" className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Ingresos por especialista</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={perSpecialist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Bar dataKey="ingresos" fill="hsl(220 40% 30%)" name="Ingresos" />
                    <Bar dataKey="consultas" fill="hsl(40 70% 55%)" name="Consultas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2">Especialista</th><th>Consultas</th><th>Pacientes</th><th>Ingresos</th><th>Ticket prom.</th><th></th></tr></thead>
                  <tbody>
                    {perSpecialist.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 font-medium">{s.name} {specialistById[s.id]?.is_partner && <Badge className="ml-1" variant="outline">Socio</Badge>}</td>
                        <td>{s.consultas}</td>
                        <td>{s.pacientesCount}</td>
                        <td className="font-mono">${s.ingresos.toLocaleString()}</td>
                        <td className="font-mono">${s.ticket.toFixed(0)}</td>
                        <td className="text-right"><Badge variant={specialistById[s.id]?.is_active ? "secondary" : "outline"}>{specialistById[s.id]?.is_active ? "Activo" : "Inactivo"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reception">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Cobros por recepción</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2"># Cobros</th><th>Monto cobrado</th><th>Persona</th></tr></thead>
                  <tbody>
                    {perReceptionist.map((r) => (
                      <tr key={r.id} className="border-t"><td className="py-2">{r.cobros}</td><td className="font-mono">${r.monto.toLocaleString()}</td><td>{r.name}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Últimos 6 meses</CardTitle></CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={tendencia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" stroke="hsl(160 50% 40%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="gastos" stroke="hsl(0 60% 55%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="consultas" stroke="hsl(220 40% 30%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <TabsContent value="partners">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Reparto entre socios</CardTitle><CardDescription>Cada socio recibe el 100% de sus consultas. Los gastos del periodo se dividen en partes iguales entre socios activos.</CardDescription></CardHeader>
                <CardContent>
                  {(() => {
                    const sociosActivos = specialists.filter((s) => s.is_partner && s.is_active);
                    const gastoPorSocio = sociosActivos.length ? totals.gastos / sociosActivos.length : 0;
                    const data = sociosActivos.map((s) => {
                      const ingresos = perSpecialist.find((p) => p.id === s.id)?.ingresos ?? 0;
                      return { name: s.full_name, ingresos, gastos: gastoPorSocio, neto: ingresos - gastoPorSocio };
                    });
                    return (
                      <>
                        <div style={{ height: 280 }}>
                          <ResponsiveContainer>
                            <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis />
                              <ReTooltip />
                              <Legend />
                              <Bar dataKey="ingresos" fill="hsl(160 50% 40%)" name="Ingresos" />
                              <Bar dataKey="gastos" fill="hsl(0 60% 55%)" name="Gastos repartidos" />
                              <Bar dataKey="neto" fill="hsl(220 40% 30%)" name="Neto" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto mt-4">
                          <table className="w-full text-sm">
                            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Socio</th><th>Ingresos</th><th>Gasto repartido</th><th>Neto</th></tr></thead>
                            <tbody>
                              {data.map((d) => (
                                <tr key={d.name} className="border-t"><td className="py-2 font-medium">{d.name}</td><td className="font-mono">${d.ingresos.toLocaleString()}</td><td className="font-mono">${d.gastos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td><td className="font-mono font-semibold">${d.neto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
