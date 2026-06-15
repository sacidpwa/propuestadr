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
import { ArrowLeft, LogOut, Plus, Paperclip, Trash2 } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Entry {
  id: string; description: string; amount: number; expense_date: string;
  category: string | null; notes: string | null; entry_type: string;
  receipt_url: string | null; operation_date: string | null; health_unit_id: string | null;
  period_month: number; period_year: number; purchase_order_id: string | null;
}

const TYPE_LABEL: Record<string, string> = { gasto: "Gasto", ingreso: "Ingreso", orden_pago: "Orden de pago" };
const TYPE_STYLE: Record<string, string> = {
  gasto: "bg-red-500/10 text-red-700 border-red-500/30",
  ingreso: "bg-green-500/10 text-green-700 border-green-500/30",
  orden_pago: "bg-blue-500/10 text-blue-700 border-blue-500/30",
};

export default function GastosUnidad() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ entry_type: "gasto", description: "", amount: 0, category: "", notes: "", operation_date: new Date().toISOString().slice(0, 10), file: undefined as File | undefined });

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function load() {
    if (!unitId) return;
    let q = (supabase.from as any)("expense_entries").select("*").eq("health_unit_id", unitId).order("expense_date", { ascending: false });
    if (filter !== "todos") q = q.eq("entry_type", filter);
    const { data } = await q;
    setEntries((data as any) || []);
  }
  useEffect(() => { load(); }, [unitId, filter]);

  const totals = useMemo(() => {
    const g = entries.filter(e => e.entry_type === "gasto").reduce((s, e) => s + Number(e.amount), 0);
    const i = entries.filter(e => e.entry_type === "ingreso").reduce((s, e) => s + Number(e.amount), 0);
    const o = entries.filter(e => e.entry_type === "orden_pago").reduce((s, e) => s + Number(e.amount), 0);
    return { g, i, o, balance: i - g };
  }, [entries]);

  async function uploadReceipt(file: File): Promise<string | null> {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) { toast({ title: "Error subiendo comprobante", description: error.message, variant: "destructive" }); return null; }
    return path;
  }

  async function save() {
    if (!unitId || !user) return;
    if (!form.description.trim() || !form.amount) { toast({ title: "Faltan datos", variant: "destructive" }); return; }
    const opDate = new Date(form.operation_date);
    let receipt: string | null = null;
    if (form.file) receipt = await uploadReceipt(form.file);
    const { error } = await (supabase.from as any)("expense_entries").insert({
      health_unit_id: unitId,
      entry_type: form.entry_type,
      description: form.description,
      amount: form.amount,
      category: form.category || null,
      notes: form.notes || null,
      operation_date: form.operation_date,
      expense_date: form.operation_date,
      period_month: opDate.getMonth() + 1,
      period_year: opDate.getFullYear(),
      receipt_url: receipt,
      created_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Registrado" });
    setOpen(false);
    setForm({ entry_type: "gasto", description: "", amount: 0, category: "", notes: "", operation_date: new Date().toISOString().slice(0, 10), file: undefined });
    load();
  }

  async function viewReceipt(path: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error } = await (supabase.from as any)("expense_entries").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
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
              <h1 className="text-lg font-bold">Control de gastos — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Ingresos</p><p className="text-xl font-bold text-green-700">${totals.i.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Gastos</p><p className="text-xl font-bold text-red-700">${totals.g.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Órdenes de pago</p><p className="text-xl font-bold text-blue-700">${totals.o.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Balance</p><p className={`text-xl font-bold ${totals.balance >= 0 ? "text-green-700" : "text-red-700"}`}>${totals.balance.toFixed(2)}</p></CardContent></Card>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ingreso">Ingresos</TabsTrigger>
              <TabsTrigger value="gasto">Gastos</TabsTrigger>
              <TabsTrigger value="orden_pago">Órdenes de pago</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nuevo registro</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo registro</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.entry_type} onValueChange={v => setForm({ ...form, entry_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TYPE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fecha</Label><Input type="date" value={form.operation_date} onChange={e => setForm({ ...form, operation_date: e.target.value })} /></div>
                </div>
                <div><Label>Descripción</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Categoría</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                </div>
                <div><Label>Comprobante (foto/PDF)</Label><Input type="file" accept="image/*,application/pdf" onChange={e => setForm({ ...form, file: e.target.files?.[0] })} /></div>
                <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {entries.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin registros.</CardContent></Card>}
          {entries.map(e => {
            const canDrill = e.purchase_order_id && unitId;
            return (
            <Card key={e.id} className={canDrill ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
                onClick={canDrill ? () => navigate(`/synapsia/unidades/${unitId}/ordenes-compra?po_id=${e.purchase_order_id}`) : undefined}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`capitalize ${TYPE_STYLE[e.entry_type]}`}>{TYPE_LABEL[e.entry_type]}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.expense_date), "PP", { locale: es })}</span>
                    {e.category && <span className="text-xs text-muted-foreground">· {e.category}</span>}
                    {canDrill && <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500/30 text-[10px]">OC</Badge>}
                  </div>
                  <p className="font-medium mt-1">{e.description}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </div>
                <div className="text-right" onClick={e => e.stopPropagation()}>
                  <p className="font-bold">${Number(e.amount).toFixed(2)}</p>
                  <div className="flex gap-1 justify-end mt-1">
                    {e.receipt_url && <Button size="icon" variant="ghost" onClick={() => viewReceipt(e.receipt_url!)}><Paperclip className="w-4 h-4" /></Button>}
                    <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
