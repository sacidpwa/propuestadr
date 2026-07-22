import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, LogOut, Plus, CreditCard, AlertCircle } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { fmt } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Fee {
  id: string; patient_name: string; amount: number; recurrence: string;
  start_date: string; next_due_date: string; is_active: boolean; notes: string | null;
}

export default function Cartera() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [fees, setFees] = useState<Fee[]>([]);
  const [filter, setFilter] = useState("morosos");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<Fee | null>(null);
  const [form, setForm] = useState({ patient_name: "", amount: 0, recurrence: "mensual", start_date: format(new Date(), "yyyy-MM-dd"), next_due_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [payment, setPayment] = useState({ amount: 0, method: "", reference: "", notes: "", paid_at: format(new Date(), "yyyy-MM-dd") });

  const canManage = hasRole("admin") || hasRole("dueno") || hasRole("contador");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function load() {
    if (!unitId) return;
    const { data } = await (supabase.from as any)("client_fees").select("*").eq("health_unit_id", unitId).order("next_due_date");
    setFees((data as any) || []);
  }
  useEffect(() => { load(); }, [unitId]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filtered = useMemo(() => {
    if (filter === "todos") return fees;
    if (filter === "activos") return fees.filter(f => f.is_active);
    if (filter === "morosos") return fees.filter(f => f.is_active && new Date(f.next_due_date) < today);
    return fees;
  }, [fees, filter]);

  const totals = useMemo(() => {
    const morosos = fees.filter(f => f.is_active && new Date(f.next_due_date) < today);
    const monto = morosos.reduce((s, f) => s + Number(f.amount), 0);
    return { morosos: morosos.length, monto, activos: fees.filter(f => f.is_active).length };
  }, [fees]);

  async function save() {
    if (!unitId || !user) return;
    if (!form.patient_name.trim() || !form.amount) { toast({ title: "Faltan datos", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("client_fees").insert({
      health_unit_id: unitId, patient_name: form.patient_name, amount: form.amount,
      recurrence: form.recurrence, start_date: form.start_date, next_due_date: form.next_due_date,
      notes: form.notes || null, created_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cuota creada" });
    setOpen(false);
    setForm({ patient_name: "", amount: 0, recurrence: "mensual", start_date: format(new Date(), "yyyy-MM-dd"), next_due_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    load();
  }

  async function registerPayment() {
    if (!payOpen || !user) return;
    if (!payment.amount) { toast({ title: "Monto requerido", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("client_fee_payments").insert({
      fee_id: payOpen.id, amount: payment.amount, method: payment.method || null, reference: payment.reference || null,
      notes: payment.notes || null, paid_at: payment.paid_at, recorded_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pago registrado" });
    setPayOpen(null);
    setPayment({ amount: 0, method: "", reference: "", notes: "", paid_at: format(new Date(), "yyyy-MM-dd") });
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Cartera de clientes — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Clientes activos</p><p className="text-xl font-bold">{totals.activos}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Morosos</p><p className="text-xl font-bold text-red-700">{totals.morosos}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Monto vencido</p><p className="text-xl font-bold text-red-700">{fmt(totals.monto)}</p></CardContent></Card>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="morosos">Morosos</TabsTrigger>
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nueva cuota</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva cuota</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente / Cliente</Label><Input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                    <div>
                      <Label>Recurrencia</Label>
                      <Select value={form.recurrence} onValueChange={v => setForm({ ...form, recurrence: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["unica", "semanal", "quincenal", "mensual"].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                    <div><Label>Próximo pago</Label><Input type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} /></div>
                  </div>
                  <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={save}>Crear</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin cuotas en este filtro.</CardContent></Card>}
          {filtered.map(f => {
            const due = new Date(f.next_due_date);
            const days = differenceInDays(due, today);
            const isOverdue = f.is_active && days < 0;
            return (
              <Card key={f.id} className={isOverdue ? "border-red-500/30" : ""}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">{f.recurrence}</Badge>
                      {!f.is_active && <Badge variant="secondary">Inactiva</Badge>}
                      {isOverdue && <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Vencida hace {Math.abs(days)} días</Badge>}
                    </div>
                    <p className="font-medium mt-1">{f.patient_name}</p>
                    <p className="text-xs text-muted-foreground">Próximo pago: {format(due, "PP", { locale: es })}</p>
                    {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">{fmt(Number(f.amount))}</p>
                    {canManage && f.is_active && (
                      <Button size="sm" onClick={() => { setPayOpen(f); setPayment({ ...payment, amount: Number(f.amount) }); }}>
                        <CreditCard className="w-4 h-4 mr-1" /> Registrar pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={!!payOpen} onOpenChange={(v) => !v && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pago de {payOpen?.patient_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={payment.amount} onChange={e => setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={payment.paid_at} onChange={e => setPayment({ ...payment, paid_at: e.target.value })} /></div>
            </div>
            <div><Label>Método</Label><Input value={payment.method} onChange={e => setPayment({ ...payment, method: e.target.value })} placeholder="efectivo, transferencia..." /></div>
            <div><Label>Referencia</Label><Input value={payment.reference} onChange={e => setPayment({ ...payment, reference: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea rows={2} value={payment.notes} onChange={e => setPayment({ ...payment, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={registerPayment}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
