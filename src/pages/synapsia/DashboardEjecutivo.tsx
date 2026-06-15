import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut, ClipboardList, ShoppingCart, FileSpreadsheet, FileText, DollarSign, AlertTriangle, Building2, ShieldCheck } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HealthUnit { id: string; name: string; }
interface ReqCount { pendiente: number; autorizada: number; total: number; }
interface PayrollRun { id: string; area: string; period_start: string; period_end: string; total_amount: number; status: string; frequency: string; health_unit_id: string; }
interface PendingInvoice { id: string; patient_name: string; amount: number; invoice_date: string; status: string; health_unit_id: string | null; }
interface OrdPago { id: string; description: string; amount: number; operation_date: string; health_unit_id: string | null; }

export default function DashboardEjecutivo() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [reqCounts, setReqCounts] = useState<Record<string, ReqCount>>({});
  const [pendingPayroll, setPendingPayroll] = useState<PayrollRun[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [pendingOrdPago, setPendingOrdPago] = useState<OrdPago[]>([]);
  const [totalCashOut, setTotalCashOut] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("id,name").order("name");
      setUnits((u as any) || []);
    })();
  }, []);

  useEffect(() => {
    if (!units.length) return;

    (async () => {
      const unitIds = units.map(u => u.id);

      // Requisiciones pendientes por unidad
      const { data: reqs } = await (supabase.from as any)("requisitions")
        .select("id, status, req_type, health_unit_id")
        .in("health_unit_id", unitIds)
        .in("status", ["pendiente", "autorizada"]);
      const rc: Record<string, ReqCount> = {};
      for (const u of units) rc[u.id] = { pendiente: 0, autorizada: 0, total: 0 };
      for (const r of (reqs as any[] || [])) {
        if (rc[r.health_unit_id]) {
          if (r.status === "pendiente") rc[r.health_unit_id].pendiente++;
          if (r.status === "autorizada") rc[r.health_unit_id].autorizada++;
          rc[r.health_unit_id].total++;
        }
      }
      setReqCounts(rc);

      // Nóminas en borrador
      const { data: payroll } = await (supabase.from as any)("payroll_runs")
        .select("id, area, period_start, period_end, total_amount, status, frequency, health_unit_id")
        .eq("status", "borrador")
        .in("health_unit_id", unitIds)
        .order("period_end", { ascending: false });
      setPendingPayroll((payroll as any) || []);

      // Facturas pendientes
      const { data: inv } = await (supabase.from as any)("patient_invoices")
        .select("id, patient_name, amount, invoice_date, status, health_unit_id")
        .eq("status", "pendiente")
        .order("invoice_date", { ascending: false });
      setPendingInvoices((inv as any) || []);

      // Órdenes de pago pendientes (expense_entries tipo orden_pago del mes actual)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: op } = await (supabase.from as any)("expense_entries")
        .select("id, description, amount, operation_date, health_unit_id")
        .eq("entry_type", "orden_pago")
        .gte("created_at", monthStart)
        .order("created_at", { ascending: false });
      setPendingOrdPago((op as any) || []);

      // Total egresos del mes (gastos + orden_pago)
      const { data: egresos } = await (supabase.from as any)("expense_entries")
        .select("amount, entry_type")
        .in("entry_type", ["gasto", "orden_pago"])
        .gte("created_at", monthStart);
      const total = (egresos as any[] || []).reduce((s, e) => s + Number(e.amount || 0), 0);
      setTotalCashOut(total);
    })();
  }, [units]);

  const pendingReqsTotal = Object.values(reqCounts).reduce((s, c) => s + c.pendiente, 0);
  const authorizedReqsTotal = Object.values(reqCounts).reduce((s, c) => s + c.autorizada, 0);

  const unitName = (id: string) => units.find(u => u.id === id)?.name || id;
  const unitSlug = (id: string) => units.find(u => u.id === id)?.name.toLowerCase().replace(/\s+/g, "-") || id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Dashboard Ejecutivo</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/synapsia/log-movimientos")} className="mr-2">
            Log inventario
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Fila 1: KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Requisiciones por autorizar</p>
                  <p className="text-3xl font-bold">{pendingReqsTotal}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-yellow-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Nóminas en borrador</p>
                  <p className="text-3xl font-bold">{pendingPayroll.length}</p>
                </div>
                <FileSpreadsheet className="w-8 h-8 text-blue-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Facturas por verificar</p>
                  <p className="text-3xl font-bold">{pendingInvoices.length}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Órdenes de pago activas</p>
                  <p className="text-3xl font-bold">{pendingOrdPago.length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-red-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fila 2: Alertas y resumen financiero */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Alertas */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Alertas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pendingReqsTotal > 0 && (
                <p className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">{pendingReqsTotal}</Badge>
                  requisiciones esperan autorización
                </p>
              )}
              {pendingPayroll.length > 0 && (
                <p className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">{pendingPayroll.length}</Badge>
                  nóminas sin autorizar
                </p>
              )}
              {pendingInvoices.length > 0 && (
                <p className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30">{pendingInvoices.length}</Badge>
                  facturas por verificar
                </p>
              )}
              {pendingOrdPago.length > 0 && (
                <p className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">${pendingOrdPago.reduce((s, o) => s + Number(o.amount || 0), 0).toLocaleString()}</Badge>
                  en órdenes de pago activas
                </p>
              )}
              {pendingReqsTotal === 0 && pendingPayroll.length === 0 && pendingInvoices.length === 0 && pendingOrdPago.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin alertas pendientes</p>
              )}
            </CardContent>
          </Card>

          {/* Egresos del mes */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-red-500" />Egresos del mes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-700">${totalCashOut.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Gastos + órdenes de pago registradas</p>
            </CardContent>
          </Card>

          {/* Acceso rápido */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4" />Acceso rápido</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate("/synapsia/autorizaciones")}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Centro de autorizaciones
              </Button>
              {units.map(u => (
                <Button key={u.id} variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate(`/synapsia/unidades/${u.id}`)}>
                  <Building2 className="w-4 h-4 mr-2" /> {u.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Fila 3: Requisiciones por unidad */}
        {units.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Requisiciones por unidad</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-center">Pendientes</TableHead>
                    <TableHead className="text-center">Autorizadas</TableHead>
                    <TableHead className="text-center">Total activas</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map(u => {
                    const c = reqCounts[u.id];
                    if (!c) return null;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">{c.pendiente}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700">{c.autorizada}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">{c.total}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/synapsia/unidades/${u.id}`)}>
                            Ir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Fila 4: Nóminas pendientes + Órdenes de pago */}
        <div className="grid md:grid-cols-2 gap-4">
          {pendingPayroll.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Nóminas por autorizar</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayroll.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{unitName(r.health_unit_id)}</TableCell>
                        <TableCell className="capitalize">{r.area}</TableCell>
                        <TableCell className="text-xs">{r.period_start} — {r.period_end}</TableCell>
                        <TableCell className="text-right font-mono">${Number(r.total_amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {pendingOrdPago.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Órdenes de pago activas</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrdPago.map(o => (
                      <TableRow key={o.id}>
                        <TableCell>{o.health_unit_id ? unitName(o.health_unit_id) : "—"}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{o.description}</TableCell>
                        <TableCell className="text-xs">{o.operation_date ? format(new Date(o.operation_date), "dd/MM", { locale: es }) : "—"}</TableCell>
                        <TableCell className="text-right font-mono">${Number(o.amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fila 5: Facturas pendientes */}
        {pendingInvoices.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Facturas por verificar</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.patient_name}</TableCell>
                      <TableCell>{f.health_unit_id ? unitName(f.health_unit_id) : "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(f.invoice_date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-right font-mono">${Number(f.amount).toLocaleString()}</TableCell>
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
