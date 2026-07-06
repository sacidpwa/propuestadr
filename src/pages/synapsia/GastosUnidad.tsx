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
import PinPrompt from "@/components/synapsia/PinPrompt";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, LogOut, Plus, Paperclip, Trash2, ArrowRight, Pencil, CreditCard, Loader2 } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmt } from "@/lib/utils";

interface Entry {
  id: string; description: string; amount: number; expense_date: string;
  category: string | null; notes: string | null; entry_type: string;
  receipt_url: string | null; operation_date: string | null; health_unit_id: string | null;
  period_month: number; period_year: number; purchase_order_id: string | null;
  patient_id: string | null; patient_name: string | null;
}

const TYPE_LABEL: Record<string, string> = { gasto: "Gasto", ingreso: "Ingreso", orden_pago: "Orden de pago" };
const TYPE_STYLE: Record<string, string> = {
  gasto: "bg-red-500/10 text-red-700 border-red-500/30",
  ingreso: "bg-green-500/10 text-green-700 border-green-500/30",
  orden_pago: "bg-blue-500/10 text-blue-700 border-blue-500/30",
};

export default function GastosUnidad() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ entry_type: "gasto", description: "", amount: 0, category: "", notes: "", operation_date: format(new Date(), "yyyy-MM-dd"), file: undefined as File | undefined, patient_id: "", patient_name: "" });
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const isEditing = !!editingId;

  const [payOpen, setPayOpen] = useState(false);
  const [payEntry, setPayEntry] = useState<Entry | null>(null);
  const [payMethod, setPayMethod] = useState("transferencia");
  const [payRef, setPayRef] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => {});
  const [pinTitle, setPinTitle] = useState("");

  function waitForFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data } = await (supabase.from as any)("patients").select("id, full_name").order("full_name");
      setPatients((data as any) || []);
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

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.full_name.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  const filtered = useMemo(() => {
    let list = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.patient_name && e.patient_name.toLowerCase().includes(q))
      );
    }
    if (dateFrom) list = list.filter(e => e.expense_date >= dateFrom);
    if (dateTo) list = list.filter(e => e.expense_date <= dateTo);
    if (amountMin) list = list.filter(e => Number(e.amount) >= parseFloat(amountMin));
    if (amountMax) list = list.filter(e => Number(e.amount) <= parseFloat(amountMax));
    return list;
  }, [entries, search, dateFrom, dateTo, amountMin, amountMax]);

  const totals = useMemo(() => {
    const g = filtered.filter(e => e.entry_type === "gasto").reduce((s, e) => s + Number(e.amount), 0);
    const i = filtered.filter(e => e.entry_type === "ingreso").reduce((s, e) => s + Number(e.amount), 0);
    const o = filtered.filter(e => e.entry_type === "orden_pago").reduce((s, e) => s + Number(e.amount), 0);
    return { g, i, o, balance: i - g };
  }, [filtered]);

  async function uploadReceipt(file: File): Promise<string | null> {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) { toast({ title: "Error subiendo comprobante", description: error.message, variant: "destructive" }); return null; }
    return path;
  }

  const defaultForm = () => ({ entry_type: "gasto", description: "", amount: 0, category: "", notes: "", operation_date: format(new Date(), "yyyy-MM-dd"), file: undefined as File | undefined, patient_id: "", patient_name: "" });

  function openNew() {
    setEditingId(null);
    setForm(defaultForm());
    setPatientSearch("");
    setPaymentType("");
    setOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      entry_type: entry.entry_type,
      description: entry.description,
      amount: Number(entry.amount),
      category: entry.category || "",
      notes: entry.notes || "",
      operation_date: entry.operation_date || entry.expense_date,
      file: undefined,
      patient_id: entry.patient_id || "",
      patient_name: entry.patient_name || "",
    });
    setPatientSearch(entry.patient_name || "");
    setPaymentType(entry.entry_type === "ingreso" && entry.patient_id ? (entry.category === "Nota de venta" ? "nota_venta" : "mensualidad") : "");
    setOpen(true);
  }

  async function save() {
    if (!unitId || !user) return;
    if (!form.description.trim() || !form.amount) { toast({ title: "Faltan datos", variant: "destructive" }); return; }
    const opDate = new Date(form.operation_date);
    let receipt: string | null = null;
    if (form.file) receipt = await uploadReceipt(form.file);

    const payload: any = {
      entry_type: form.entry_type,
      description: form.description,
      amount: form.amount,
      category: form.entry_type === "ingreso" && form.patient_id && paymentType ? (paymentType === "mensualidad" ? "Mensualidad" : "Nota de venta") : form.category || null,
      notes: form.notes || null,
      operation_date: form.operation_date,
      expense_date: form.operation_date,
      period_month: opDate.getMonth() + 1,
      period_year: opDate.getFullYear(),
      patient_id: form.patient_id || null,
      patient_name: form.patient_name || null,
    };

    if (isEditing) {
      if (receipt) payload.receipt_url = receipt;
      const { error } = await (supabase.from as any)("expense_entries").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Actualizado" });
    } else {
      payload.health_unit_id = unitId;
      payload.receipt_url = receipt;
      payload.created_by = user.id;
      const { error } = await (supabase.from as any)("expense_entries").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Registrado" });
    }

    setOpen(false);
    setEditingId(null);
    setForm(defaultForm());
    setPatientSearch("");
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

  function askPin(title: string, action: () => Promise<void>) {
    setPinTitle(title);
    setPinAction(() => action);
    setPinOpen(true);
  }

  async function convertPay(entry: Entry, method: string, ref: string) {
    const { error } = await (supabase.from as any)("expense_entries").update({
      entry_type: "gasto",
      notes: `Pagado: ${method}${ref ? ", ref: " + ref : ""}`,
    }).eq("id", entry.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Orden de pago convertida a gasto" });
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
              <h1 className="text-lg font-bold">Control de flujos — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Ingresos</p><p className="text-xl font-bold text-green-700">{fmt(totals.i)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Gastos</p><p className="text-xl font-bold text-red-700">{fmt(totals.g)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Órdenes de pago</p><p className="text-xl font-bold text-blue-700">{fmt(totals.o)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Balance</p><p className={`text-xl font-bold ${totals.balance >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(totals.balance)}</p></CardContent></Card>
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
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo registro</Button>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Buscar por concepto</Label>
            <Input placeholder="Descripción, categoría o notas..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Fecha desde</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div>
            <Label className="text-xs">Fecha hasta</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-40" />
          </div>
          <div>
            <Label className="text-xs">Monto mínimo</Label>
            <Input type="number" min="0" step="0.01" placeholder="$0" value={amountMin} onChange={e => setAmountMin(e.target.value)} className="h-9 w-28" />
          </div>
          <div>
            <Label className="text-xs">Monto máximo</Label>
            <Input type="number" min="0" step="0.01" placeholder="$9999" value={amountMax} onChange={e => setAmountMax(e.target.value)} className="h-9 w-28" />
          </div>
          {(search || dateFrom || dateTo || amountMin || amountMax) && (
            <Button variant="ghost" size="sm" className="h-9" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax(""); }}>
              Limpiar filtros
            </Button>
          )}
        </div>

        <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); setPatientSearch(""); } setOpen(v); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{isEditing ? "Editar registro" : "Nuevo registro"}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
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

              {form.entry_type === "ingreso" && (
                <div>
                  <Label>Paciente (opcional)</Label>
                  <Input
                    placeholder="Buscar paciente..."
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      setForm({ ...form, patient_id: "", patient_name: "" });
                      setPaymentType("");
                    }}
                    list="incomePatients"
                  />
                  <datalist id="incomePatients">
                    {filteredPatients.map(p => (
                      <option key={p.id} value={p.full_name} />
                    ))}
                  </datalist>
                  {patientSearch && (
                    <div className="mt-1 max-h-32 overflow-y-auto border rounded text-sm">
                      {filteredPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-2 py-1 hover:bg-accent"
                          onClick={() => { setPatientSearch(p.full_name); setForm({ ...form, patient_id: p.id, patient_name: p.full_name }); setPaymentType("mensualidad"); }}
                        >
                          {p.full_name}
                        </button>
                      ))}
                      {!filteredPatients.length && <p className="px-2 py-1 text-muted-foreground">Sin resultados</p>}
                    </div>
                  )}
                  {form.patient_id && (
                    <div className="mt-2">
                      <Label>Tipo de abono</Label>
                      <Select value={paymentType} onValueChange={setPaymentType}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensualidad">Abono a mensualidad</SelectItem>
                          <SelectItem value="nota_venta">Abono a nota de venta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div><Label>Descripción</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Categoría</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div><Label>Comprobante (foto/PDF)</Label><Input type="file" accept="image/*,application/pdf" onChange={e => setForm({ ...form, file: e.target.files?.[0] })} /></div>
              <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); }}>Cancelar</Button>
              <Button onClick={save}>{isEditing ? "Actualizar" : "Guardar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-2">
          {filtered.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin registros.</CardContent></Card>}
          {filtered.map(e => {
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
                    {e.patient_name && <span className="text-xs text-muted-foreground">· Paciente: {e.patient_name}</span>}
                    {canDrill && <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-500/30 text-[10px]">OC</Badge>}
                  </div>
                  <p className="font-medium mt-1">{e.description}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </div>
                <div className="text-right" onClick={e => e.stopPropagation()}>
                  <p className="font-bold">{fmt(Number(e.amount))}</p>
                  <div className="flex gap-1 justify-end mt-1">
                    {e.entry_type === "orden_pago" && (hasRole("admin") || hasRole("dueno") || hasRole("administrativo")) && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPayEntry(e); setPayMethod("transferencia"); setPayRef(""); setPayOpen(true); }}>
                        <ArrowRight className="w-3 h-3 mr-1" /> Pagar
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                    {e.receipt_url && <Button size="icon" variant="ghost" onClick={() => viewReceipt(e.receipt_url!)}><Paperclip className="w-4 h-4" /></Button>}
                    <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Pagar orden de pago</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Método de pago</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Referencia / folio</Label>
                <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
              <Button onClick={() => { setPayOpen(false); askPin("Confirmar pago", async () => { if (payEntry) await convertPay(payEntry, payMethod, payRef); }); }}>
                <CreditCard className="w-4 h-4 mr-1" /> Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PinPrompt open={pinOpen} onOpenChange={setPinOpen} title={pinTitle} onConfirm={pinAction} />
      </main>
    </div>
  );
}
