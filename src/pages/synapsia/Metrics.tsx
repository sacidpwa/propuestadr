import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, TrendingUp, DollarSign, Users, Activity, Wallet, AlertCircle, BookOpen, FileText } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, LineChart, Line } from "recharts";
import { fmt } from "@/lib/utils";

interface ConsultRow {
  id: string; specialist_name: string; specialist_id: string | null; patient_name: string; service_type: string;
  cost: number; amount_collected: number | null; record_date: string; has_invoice: boolean;
}

interface Visit {
  id: string; specialist_id: string; arrival_time: string; status: string; receptionist_id: string | null;
  patient_id: string;
}
interface Payment { id: string; visit_id: string; amount: number; payment_method: string; collected_by: string | null; created_at: string; }
interface Specialist { id: string; full_name: string; consultation_fee: number; is_partner: boolean; is_active: boolean; user_id: string | null; }
interface ExpenseEntry { id: string; amount: number; period_year: number; period_month: number; expense_date: string; description: string; }



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
  const [consultLog, setConsultLog] = useState<ConsultRow[]>([]);
  const [synapsiaUnitId, setSynapsiaUnitId] = useState<string | null>(null);

  const isOwner = hasRole("admin") || hasRole("dueno");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("health_units").select("id").eq("name", "Synapsia Consultorio").maybeSingle();
      setSynapsiaUnitId((data as any)?.id ?? null);
    })();
  }, []);

  useEffect(() => { fetchAll(); }, [period, synapsiaUnitId]);

  const fetchAll = async () => {
    const now = new Date();
    let from: Date | null = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "ytd") from = new Date(now.getFullYear(), 0, 1);
    if (period === "all") from = null;
    const fromIso = from?.toISOString();

    const visitsQ = supabase.from("visits").select("id, specialist_id, arrival_time, status, receptionist_id, patient_id").order("arrival_time", { ascending: true });
    const paymentsQ = supabase.from("payments").select("id, visit_id, amount, payment_method, collected_by, created_at").order("created_at", { ascending: true });
    const expensesQ = synapsiaUnitId
      ? supabase.from("expense_entries").select("id, amount, period_year, period_month, expense_date, description").eq("health_unit_id", synapsiaUnitId)
      : supabase.from("expense_entries").select("id, amount, period_year, period_month, expense_date, description");
    let consultLogQ = supabase.from("consultation_log").select("id, specialist_name, specialist_id, patient_name, service_type, cost, amount_collected, record_date, has_invoice").order("record_date", { ascending: false });
    if (fromIso) consultLogQ = consultLogQ.gte("record_date", fromIso.slice(0, 10));

    const [{ data: v }, { data: pmt }, { data: s }, { data: e }, { data: pr }, { data: cl }] = await Promise.all([
      fromIso ? visitsQ.gte("arrival_time", fromIso) : visitsQ,
      fromIso ? paymentsQ.gte("created_at", fromIso) : paymentsQ,
      supabase.from("specialists").select("id, full_name, consultation_fee, is_partner, is_active, user_id").order("full_name"),
      expensesQ,
      supabase.from("profiles").select("user_id, full_name, email"),
      consultLogQ,
    ]);
    setVisits((v as any) || []);
    setPayments((pmt as any) || []);
    setSpecialists((s as any) || []);
    setExpenses((e as any) || []);
    setProfiles((pr as any) || []);
    setConsultLog((cl as any) || []);
  };

  // Map visit -> specialist; payment -> visit
  const visitById = useMemo(() => Object.fromEntries(visits.map((v) => [v.id, v])), [visits]);
  const specialistById = useMemo(() => Object.fromEntries(specialists.map((s) => [s.id, s])), [specialists]);

  // Aggregations per specialist (visits/payments + consultation_log)
  const perSpecialist = useMemo(() => {
    const acc: Record<string, { id: string; name: string; consultas: number; recepcion: number; totalIngresos: number; pacientes: Set<string>; ticket: number; diarioConsultas: number; diarioFacturado: number; diarioCobrado: number; }> = {};
    specialists.forEach((s) => { acc[s.id] = { id: s.id, name: s.full_name, consultas: 0, recepcion: 0, totalIngresos: 0, pacientes: new Set(), ticket: 0, diarioConsultas: 0, diarioFacturado: 0, diarioCobrado: 0 }; });
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
      a.recepcion += Number(p.amount);
    });
    consultLog.forEach((c) => {
      if (!c.specialist_id) return;
      const a = acc[c.specialist_id]; if (!a) return;
      a.diarioConsultas++;
      a.diarioFacturado += Number(c.cost || 0);
      a.diarioCobrado += Number(c.amount_collected || 0);
    });
    return Object.values(acc).map((a) => ({ ...a, pacientesCount: a.pacientes.size, ticket: a.consultas ? a.recepcion / a.consultas : 0, totalIngresos: a.recepcion + a.diarioCobrado }));
  }, [visits, payments, specialists, visitById, consultLog]);

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
    const recepcion = payments.reduce((s, p) => s + Number(p.amount), 0);
    const cobradoDiario = consultLog.reduce((s, c) => s + Number(c.amount_collected || 0), 0);
    const ingresos = recepcion + cobradoDiario;
    const consultas = visits.filter((v) => v.status === "atendido" || v.status === "en_consulta").length;
    const pacientesUnicos = new Set(visits.map((v) => v.patient_id)).size;
    const gastos = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return { recepcion, cobradoDiario, ingresos, consultas, pacientesUnicos, gastos, neto: ingresos - gastos };
  }, [payments, visits, expenses, consultLog]);

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

  // Consultation log aggregated per specialist (via specialist_id or specialist_name)
  const consultPerSpecialist = useMemo(() => {
    const acc: Record<string, { nombre: string; consultas: number; cobrado: number; costo: number; facturado: number }> = {};
    consultLog.forEach((c) => {
      const key = c.specialist_id || c.specialist_name || "Sin asignar";
      const name = c.specialist_id ? (specialistById[c.specialist_id]?.full_name || c.specialist_name) : (c.specialist_name || "Sin asignar");
      if (!acc[key]) acc[key] = { nombre: name, consultas: 0, cobrado: 0, costo: 0, facturado: 0 };
      acc[key].consultas++;
      acc[key].costo += Number(c.cost || 0);
      acc[key].cobrado += Number(c.amount_collected || 0);
      if (c.has_invoice) acc[key].facturado += Number(c.cost || 0);
    });
    return Object.values(acc).sort((a, b) => b.cobrado - a.cobrado);
  }, [consultLog, specialistById]);

  // Consultation log daily totals for current period
  const consultDaily = useMemo(() => {
    const map: Record<string, { day: string; consultas: number; cobrado: number }> = {};
    consultLog.forEach((c) => {
      const d = c.record_date?.slice(0, 10);
      if (!d) return;
      map[d] = map[d] || { day: d, consultas: 0, cobrado: 0 };
      map[d].consultas++;
      map[d].cobrado += Number(c.amount_collected || 0);
    });
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
  }, [consultLog]);

  const consultTotals = useMemo(() => {
    const consultas = consultLog.length;
    const cobrado = consultLog.reduce((s, c) => s + Number(c.amount_collected || 0), 0);
    const facturado = consultLog.filter((c) => c.has_invoice).reduce((s, c) => s + Number(c.cost || 0), 0);
    const pendienteDiario = facturado - consultLog.filter((c) => c.has_invoice).reduce((s, c) => s + Number(c.amount_collected || 0), 0);
    const pendienteRecepcion = pendientes.total;
    return { consultas, cobrado, facturado, pendiente: pendienteDiario + pendienteRecepcion, pendienteDiario, pendienteRecepcion };
  }, [consultLog, pendientes]);

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
                  <Stat icon={<DollarSign />} label="Recepción" value={fmt(focusedRows.recepcion)} />
                  <Stat icon={<BookOpen />} label="Total ingresos" value={fmt(focusedRows.totalIngresos)} />
                  <Stat icon={<TrendingUp />} label="Ticket prom." value={`$${focusedRows.ticket.toFixed(0)}`} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este usuario no está vinculado a un especialista. Solo se muestran métricas globales abajo.</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat icon={<DollarSign className="text-green-600" />} label="Recepción" value={fmt(totals.recepcion)} />
          <Stat icon={<BookOpen className="text-violet-600" />} label="Diario cobrado" value={fmt(totals.cobradoDiario)} />
          <Stat icon={<TrendingUp className="text-primary" />} label="Total ingresos" value={fmt(totals.ingresos)} highlight />
          <Stat icon={<Wallet className="text-orange-600" />} label="Gastos" value={fmt(totals.gastos)} />
          <Stat icon={<TrendingUp />} label="Neto" value={fmt(totals.neto)} />
        </div>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <div className="text-sm">
              <span className="font-semibold">Pendiente de cobro total:</span>{" "}
              <span className="font-mono">{fmt(consultTotals.pendiente)}</span>{" "}
              <span className="text-muted-foreground">(Recepción: {fmt(consultTotals.pendienteRecepcion)} | Diario: {fmt(consultTotals.pendienteDiario)})</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="specialists">
          <TabsList>
            <TabsTrigger value="specialists">Por especialista</TabsTrigger>
            <TabsTrigger value="reception">Recepción</TabsTrigger>
            <TabsTrigger value="consultorio">Consultorio</TabsTrigger>
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
                    <Bar dataKey="totalIngresos" fill="hsl(220 40% 30%)" name="Total ingresos" />
                    <Bar dataKey="recepcion" fill="hsl(160 50% 40%)" name="Recepción" />
                    <Bar dataKey="consultas" fill="hsl(40 70% 55%)" name="Consultas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2">Especialista</th><th>Consultas</th><th>Pacientes</th><th>Recepción</th><th>Ticket prom.</th><th>Del diario</th><th>Facturado</th><th>Cobrado</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {perSpecialist.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 font-medium">{s.name} {specialistById[s.id]?.is_partner && <Badge className="ml-1" variant="outline">Socio</Badge>}</td>
                        <td>{s.consultas}</td>
                        <td>{s.pacientesCount}</td>
                        <td className="font-mono">{s.recepcion ? fmt(s.recepcion) : "—"}</td>
                        <td className="font-mono">${s.ticket.toFixed(0)}</td>
                        <td className="font-mono">{s.diarioConsultas || "—"}</td>
                        <td className="font-mono">{s.diarioFacturado ? fmt(s.diarioFacturado) : "—"}</td>
                        <td className="font-mono">{s.diarioCobrado ? fmt(s.diarioCobrado) : "—"}</td>
                        <td className="font-mono font-semibold">{fmt(s.totalIngresos)}</td>
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

          <TabsContent value="consultorio">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Stat icon={<BookOpen className="text-violet-600" />} label="Consultas diario" value={consultTotals.consultas.toString()} />
              <Stat icon={<DollarSign className="text-teal-600" />} label="Cobrado diario" value={fmt(consultTotals.cobrado)} />
              <Stat icon={<FileText className="text-blue-600" />} label="Facturado (con factura)" value={fmt(consultTotals.facturado)} />
              <Stat icon={<AlertCircle className={consultTotals.pendiente > 0 ? "text-amber-600" : "text-green-600"} />} label="Pendiente total" value={fmt(consultTotals.pendiente)} />
            </div>
            {/* Daily chart */}
            {consultDaily.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2"><CardTitle className="text-base">Consultas diarias</CardTitle><CardDescription>Últimos registros del periodo</CardDescription></CardHeader>
                <CardContent style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={consultDaily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
                      <ReTooltip formatter={(v: number, name: string) => name === "consultas" ? v : `$${v.toLocaleString()}`} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="consultas" fill="#8b5cf6" name="Consultas" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="cobrado" fill="#14b8a6" name="Cobrado" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {/* By specialist */}
            {consultPerSpecialist.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Por médico</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted-foreground"><th className="py-2">Médico</th><th>Consultas</th><th>Costo total</th><th>Facturado (con factura)</th><th>Cobrado</th><th>Pendiente</th></tr></thead>
                    <tbody>
                      {consultPerSpecialist.map((s) => (
                        <tr key={s.nombre} className="border-t">
                          <td className="py-2 font-medium">{s.nombre}</td>
                          <td>{s.consultas}</td>
                          <td className="font-mono">{fmt(s.costo)}</td>
                          <td className="font-mono">{fmt(s.facturado)}</td>
                          <td className="font-mono">{fmt(s.cobrado)}</td>
                          <td className="font-mono">{fmt(s.costo - s.cobrado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            {consultLog.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No hay registros en el diario para este periodo.</p>
                </CardContent>
              </Card>
            )}
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
