import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PinPrompt from "@/components/synapsia/PinPrompt";
import { ArrowLeft, LogOut, Plus, Check, HandCoins, Users, FileSpreadsheet } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Area = "enfermeria" | "intendencia" | "mantenimiento" | "administrativo" | "otro";
type Frequency = "semanal" | "quincenal" | "mensual";
type RunStatus = "borrador" | "autorizada" | "pagada" | "cancelada";

interface Employee {
  id: string; full_name: string; rfc: string | null; position: string | null;
  area: Area; health_unit_id: string | null; base_salary: number;
  frequency: Frequency; bank: string | null; bank_account: string | null; is_active: boolean;
}
interface Run {
  id: string; area: Area; period_start: string; period_end: string; frequency: Frequency;
  total_amount: number; status: RunStatus; notes: string | null;
  authorized_at: string | null; paid_at: string | null; payment_method: string | null; payment_reference: string | null;
}
interface Item {
  id: string; run_id: string; employee_id: string; employee_name: string;
  base_amount: number; bonuses: number; deductions: number; absences: number; overtime: number; net_amount: number; notes: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  borrador: "bg-muted text-foreground border-border",
  autorizada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  pagada: "bg-green-500/10 text-green-700 border-green-500/30",
  cancelada: "bg-red-500/10 text-red-700 border-red-500/30",
};

export default function Nomina() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const [unitName, setUnitName] = useState("");
  const [tab, setTab] = useState<"runs" | "employees">("runs");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const [empDialog, setEmpDialog] = useState(false);
  const [empForm, setEmpForm] = useState<Partial<Employee>>({ area: "enfermeria", frequency: "quincenal", base_salary: 0, is_active: true });

  const [runDialog, setRunDialog] = useState(false);
  const [runForm, setRunForm] = useState<{ area: Area; frequency: Frequency; period_start: string; period_end: string; notes: string }>({
    area: "enfermeria", frequency: "quincenal", period_start: "", period_end: "", notes: "",
  });

  const [pinAction, setPinAction] = useState<null | { type: "autorizar" | "pagar" | "pagar-pin"; runId: string }>(null);
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [paymentRef, setPaymentRef] = useState("");

  const canManage = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName(data?.name || "Unidad");
    })();
  }, [unitId]);

  const load = async () => {
    if (!unitId) return;
    const [{ data: emp }, { data: rn }] = await Promise.all([
      (supabase.from as any)("payroll_employees").select("*").eq("health_unit_id", unitId).order("full_name"),
      (supabase.from as any)("payroll_runs").select("*").eq("health_unit_id", unitId).order("period_end", { ascending: false }),
    ]);
    setEmployees((emp as Employee[]) || []);
    setRuns((rn as Run[]) || []);
    if (rn && rn.length) {
      const ids = rn.map((r: any) => r.id);
      const { data: it } = await (supabase.from as any)("payroll_items").select("*").in("run_id", ids);
      const grouped: Record<string, Item[]> = {};
      (it as Item[] || []).forEach((i) => { (grouped[i.run_id] = grouped[i.run_id] || []).push(i); });
      setItems(grouped);
    }
  };

  useEffect(() => { load(); }, [unitId]);

  const saveEmployee = async () => {
    if (!empForm.full_name || !empForm.area) { toast({ title: "Faltan datos", variant: "destructive" }); return; }
    const payload = { ...empForm, health_unit_id: unitId, created_by: user!.id };
    const { error } = await (supabase.from as any)("payroll_employees").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Empleado registrado" });
    setEmpDialog(false);
    setEmpForm({ area: "enfermeria", frequency: "quincenal", base_salary: 0, is_active: true });
    load();
  };

  const createRun = async () => {
    if (!runForm.period_start || !runForm.period_end) { toast({ title: "Define el periodo", variant: "destructive" }); return; }
    const target = employees.filter((e) => e.area === runForm.area && e.is_active);
    if (!target.length) { toast({ title: "Sin empleados para esta área", variant: "destructive" }); return; }

    const { data: run, error } = await (supabase.from as any)("payroll_runs").insert({
      health_unit_id: unitId, area: runForm.area, frequency: runForm.frequency,
      period_start: runForm.period_start, period_end: runForm.period_end, notes: runForm.notes,
      created_by: user!.id, status: "borrador",
      total_amount: target.reduce((s, e) => s + Number(e.base_salary || 0), 0),
    }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });

    const lines = target.map((e) => ({
      run_id: run.id, employee_id: e.id, employee_name: e.full_name,
      base_amount: e.base_salary, bonuses: 0, deductions: 0, absences: 0, overtime: 0, net_amount: e.base_salary,
    }));
    await (supabase.from as any)("payroll_items").insert(lines);
    toast({ title: "Nómina creada en borrador" });
    setRunDialog(false);
    setRunForm({ area: "enfermeria", frequency: "quincenal", period_start: "", period_end: "", notes: "" });
    load();
  };

  const updateItem = async (it: Item, patch: Partial<Item>) => {
    const merged = { ...it, ...patch };
    const net = Number(merged.base_amount || 0) + Number(merged.bonuses || 0) + Number(merged.overtime || 0)
              - Number(merged.deductions || 0) - Number(merged.absences || 0);
    await (supabase.from as any)("payroll_items").update({ ...patch, net_amount: net }).eq("id", it.id);
    load();
  };

  const recalcRunTotal = async (runId: string) => {
    const total = (items[runId] || []).reduce((s, i) => s + Number(i.net_amount || 0), 0);
    await (supabase.from as any)("payroll_runs").update({ total_amount: total }).eq("id", runId);
    load();
  };

  const authorize = async (runId: string) => {
    await recalcRunTotal(runId);
    await (supabase.from as any)("payroll_runs").update({
      status: "autorizada", authorized_by: user!.id, authorized_at: new Date().toISOString(),
    }).eq("id", runId);
    toast({ title: "Nómina autorizada" });
    load();
  };

  const pay = async (runId: string) => {
    const run = runs.find((r) => r.id === runId);
    await (supabase.from as any)("payroll_runs").update({
      status: "pagada", paid_by: user!.id, paid_at: new Date().toISOString(),
      payment_method: paymentMethod, payment_reference: paymentRef,
    }).eq("id", runId);
    if (run) {
      await (supabase.from as any)("expense_entries").insert({
        health_unit_id: unitId, entry_type: "gasto", description: `Nómina ${run.area} ${run.period_start} - ${run.period_end}`,
        amount: run.total_amount, expense_date: format(new Date(), "yyyy-MM-dd"),
        period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1,
        category: "nomina", created_by: user!.id,
      });
    }
    setPaymentRef(""); setPaymentMethod("transferencia");
    toast({ title: "Nómina pagada" });
    load();
  };

  const filteredRuns = useMemo(() => runs, [runs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Nómina · {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="runs"><FileSpreadsheet className="w-4 h-4 mr-2" />Periodos</TabsTrigger>
            <TabsTrigger value="employees"><Users className="w-4 h-4 mr-2" />Plantilla</TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="space-y-4">
            {canManage && (
              <div className="flex justify-end">
                <Dialog open={runDialog} onOpenChange={setRunDialog}>
                  <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nuevo periodo</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Generar nómina</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Área</Label>
                        <Select value={runForm.area} onValueChange={(v) => setRunForm({ ...runForm, area: v as Area })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enfermeria">Enfermería</SelectItem>
                            <SelectItem value="intendencia">Intendencia</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem value="administrativo">Administrativo</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frecuencia</Label>
                        <Select value={runForm.frequency} onValueChange={(v) => setRunForm({ ...runForm, frequency: v as Frequency })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quincenal">Quincenal</SelectItem>
                            <SelectItem value="mensual">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label>Inicio</Label><Input type="date" value={runForm.period_start} onChange={(e) => setRunForm({ ...runForm, period_start: e.target.value })} /></div>
                        <div><Label>Fin</Label><Input type="date" value={runForm.period_end} onChange={(e) => setRunForm({ ...runForm, period_end: e.target.value })} /></div>
                      </div>
                      <div><Label>Notas</Label><Textarea value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={createRun}>Generar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {filteredRuns.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base capitalize">{r.area} · {r.period_start} a {r.period_end}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{r.frequency} · Total ${Number(r.total_amount).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                      {canManage && r.status === "borrador" && (
                        <Button size="sm" variant="outline" onClick={() => setPinAction({ type: "autorizar", runId: r.id })}>
                          <Check className="w-4 h-4 mr-1" />Autorizar
                        </Button>
                      )}
                      {canManage && r.status === "autorizada" && (
                        <Button size="sm" onClick={() => setPinAction({ type: "pagar", runId: r.id })}>
                          <HandCoins className="w-4 h-4 mr-1" />Pagar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRun(selectedRun?.id === r.id ? null : r)}>
                        {selectedRun?.id === r.id ? "Cerrar" : "Detalle"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {selectedRun?.id === r.id && (
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead className="w-24">Base</TableHead>
                          <TableHead className="w-24">Bonos</TableHead>
                          <TableHead className="w-24">H. extra</TableHead>
                          <TableHead className="w-24">Deduc.</TableHead>
                          <TableHead className="w-24">Faltas</TableHead>
                          <TableHead className="w-28 text-right">Neto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(items[r.id] || []).map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="font-medium">{it.employee_name}</TableCell>
                            {(["base_amount", "bonuses", "overtime", "deductions", "absences"] as const).map((k) => (
                              <TableCell key={k}>
                                <Input type="number" disabled={r.status !== "borrador" || !canManage}
                                  value={Number((it as any)[k]) || 0}
                                  onChange={(e) => updateItem(it, { [k]: Number(e.target.value) } as any)}
                                  className="h-8" />
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-semibold">${Number(it.net_amount).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {r.paid_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Pagada {format(new Date(r.paid_at), "dd/MM/yyyy HH:mm")} · {r.payment_method} {r.payment_reference}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
            {!filteredRuns.length && <p className="text-sm text-muted-foreground">Sin periodos de nómina aún.</p>}
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            {canManage && (
              <div className="flex justify-end">
                <Dialog open={empDialog} onOpenChange={setEmpDialog}>
                  <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nuevo empleado</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Alta de empleado</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Nombre completo</Label><Input value={empForm.full_name || ""} onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label>RFC</Label><Input value={empForm.rfc || ""} onChange={(e) => setEmpForm({ ...empForm, rfc: e.target.value })} /></div>
                        <div><Label>Puesto</Label><Input value={empForm.position || ""} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Área</Label>
                          <Select value={empForm.area} onValueChange={(v) => setEmpForm({ ...empForm, area: v as Area })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enfermeria">Enfermería</SelectItem>
                              <SelectItem value="intendencia">Intendencia</SelectItem>
                              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                              <SelectItem value="administrativo">Administrativo</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Frecuencia</Label>
                          <Select value={empForm.frequency} onValueChange={(v) => setEmpForm({ ...empForm, frequency: v as Frequency })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="quincenal">Quincenal</SelectItem>
                              <SelectItem value="mensual">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>Sueldo base (por periodo)</Label><Input type="number" value={empForm.base_salary || 0} onChange={(e) => setEmpForm({ ...empForm, base_salary: Number(e.target.value) })} /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label>Banco</Label><Input value={empForm.bank || ""} onChange={(e) => setEmpForm({ ...empForm, bank: e.target.value })} /></div>
                        <div><Label>Cuenta / CLABE</Label><Input value={empForm.bank_account || ""} onChange={(e) => setEmpForm({ ...empForm, bank_account: e.target.value })} /></div>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={saveEmployee}>Guardar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{e.position || "—"}</TableCell>
                        <TableCell className="capitalize">{e.area}</TableCell>
                        <TableCell className="capitalize">{e.frequency}</TableCell>
                        <TableCell className="text-right">${Number(e.base_salary).toLocaleString()}</TableCell>
                        <TableCell>{e.is_active ? <Badge>Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {!employees.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sin empleados aún.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {pinAction?.type === "pagar" && (
        <Dialog open onOpenChange={(o) => !o && setPinAction(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Datos de pago</DialogTitle></DialogHeader>
            <div className="space-y-2 mb-3">
              <div>
                <Label>Método</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Referencia</Label><Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPinAction(null)}>Cancelar</Button>
              <Button onClick={() => setPinAction({ type: "pagar-pin" as any, runId: pinAction.runId })}>Continuar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <PinPrompt
        open={pinAction?.type === "autorizar" || (pinAction?.type as any) === "pagar-pin"}
        onOpenChange={(v) => { if (!v) setPinAction(null); }}
        title={pinAction?.type === "autorizar" ? "Autorizar nómina" : "Confirmar pago"}
        onConfirm={async () => {
          if (!pinAction) return;
          if (pinAction.type === "autorizar") await authorize(pinAction.runId);
          else await pay(pinAction.runId);
          setPinAction(null);
        }}
      />
    </div>
  );
}
