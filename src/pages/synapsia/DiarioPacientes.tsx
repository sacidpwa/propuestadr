import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Search } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { fmt } from "@/lib/utils";
import { format } from "date-fns";

const SERVICE_TYPES = ["Psiquiatría", "Paidopsiquiatría", "Psicología", "Evaluación Psicológica", "Pediatría"];
const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia"];

type ConsultRow = {
  id: string; health_unit_id: string; record_date: string; specialist_name: string;
  specialist_id: string | null; patient_name: string; service_type: string; cost: number; payment_method: string | null;
  amount_collected: number | null; payment_date: string | null; transfer_to: string | null;
  has_invoice: boolean; invoice_date: string | null; invoice_folio: string | null;
  notes: string | null; created_by: string; created_at: string;
};

const defaultForm = {
  record_date: format(new Date(), "yyyy-MM-dd"), specialist_id: "", specialist_name: "", patient_name: "",
  service_type: "Psicología", cost: "", payment_method: "", amount_collected: "",
  payment_date: "", transfer_to: "", has_invoice: false, invoice_date: "",
  invoice_folio: "", notes: "",
};

export default function DiarioPacientes() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<ConsultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState("");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");

  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [specialistList, setSpecialistList] = useState<{ id: string; full_name: string }[]>([]);
  const [patientList, setPatientList] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  useEffect(() => {
    (async () => {
      const { data: s } = await (supabase.from as any)("specialists").select("id, full_name").eq("is_active", true).order("full_name");
      setSpecialistList((s as any) ?? []);
    })();
    (async () => {
      const { data: p } = await (supabase.from as any)("patients").select("id, full_name").eq("is_active", true).order("full_name");
      setPatientList((p as any) ?? []);
    })();
  }, []);

  async function loadData() {
    if (!unitId) return;
    setLoading(true);
    const { data: d } = await (supabase.from as any)("consultation_log")
      .select("*").eq("health_unit_id", unitId).order("record_date", { ascending: false });
    setData((d as ConsultRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { loadData(); }, [unitId]);

  // Derive specialist names from DB list + existing data for backward compat
  const allSpecialistNames = [...new Set([...data.map(r => r.specialist_name), ...specialistList.map(s => s.full_name)])].sort();

  const filtered = data.filter(r => {
    if (filterDate && r.record_date !== filterDate) return false;
    if (filterSpecialist && r.specialist_name !== filterSpecialist) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.patient_name.toLowerCase().includes(q) && !r.specialist_name.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  function openAdd() { setEditId(null); setForm(defaultForm); setSelectedPatientId(""); setDialogOpen(true); }

  function openEdit(row: ConsultRow) {
    setEditId(row.id);
    let sid = row.specialist_id ?? "";
    let sname = row.specialist_name;
    if (!sid) {
      const match = specialistList.find(sp => sp.full_name.toLowerCase() === sname.toLowerCase());
      if (match) sid = match.id;
    }
    const matchPt = patientList.find(pt => pt.full_name.toLowerCase() === row.patient_name.toLowerCase());
    setSelectedPatientId(matchPt?.id ?? "");
    setForm({
      record_date: row.record_date, specialist_id: sid, specialist_name: sname,
      patient_name: row.patient_name, service_type: row.service_type,
      cost: row.cost ? String(row.cost) : "",
      payment_method: row.payment_method ?? "",
      amount_collected: row.amount_collected ? String(row.amount_collected) : "",
      payment_date: row.payment_date ?? "",
      transfer_to: row.transfer_to ?? "",
      has_invoice: row.has_invoice,
      invoice_date: row.invoice_date ?? "",
      invoice_folio: row.invoice_folio ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!unitId || !user) return;
    if (!form.record_date || !form.specialist_name.trim() || !form.patient_name.trim()) {
      toast({ title: "Fecha, médico y paciente son obligatorios", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      health_unit_id: unitId,
      record_date: form.record_date,
      specialist_id: form.specialist_id && form.specialist_id !== "__unset__" ? form.specialist_id : null,
      specialist_name: form.specialist_name.trim(),
      patient_name: form.patient_name.trim(),
      service_type: form.service_type,
      cost: parseFloat(form.cost) || 0,
      payment_method: form.payment_method || null,
      amount_collected: form.amount_collected ? parseFloat(form.amount_collected) : null,
      payment_date: form.payment_date || null,
      transfer_to: form.transfer_to || null,
      has_invoice: form.has_invoice,
      invoice_date: form.invoice_date || null,
      invoice_folio: form.invoice_folio || null,
      notes: form.notes || null,
    } as any;

    if (editId) {
      await (supabase.from as any)("consultation_log").update(payload).eq("id", editId);
    } else {
      await (supabase.from as any)("consultation_log").insert({ ...payload, created_by: user.id });
    }
    setSaving(false);
    setDialogOpen(false);
    toast({ title: editId ? "Actualizado" : "Guardado" });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await (supabase.from as any)("consultation_log").delete().eq("id", id);
    toast({ title: "Eliminado" });
    loadData();
  }

  const totalCobrado = filtered.reduce((s, r) => s + (r.amount_collected ?? 0), 0);

  const specialists_menu = ["", ...specialistList.map(s => s.full_name)];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Diario de Pacientes — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Nuevo registro</Button>
          <div className="flex-1" />
          <div className="relative w-60">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente o médico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" />
          <select value={filterSpecialist} onChange={e => setFilterSpecialist(e.target.value)} className="border rounded px-2 py-1.5 text-sm h-10">
            <option value="">Todos los médicos</option>
            {allSpecialistNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sin registros</TableCell></TableRow>
              ) : filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.record_date}</TableCell>
                  <TableCell>{row.specialist_name}</TableCell>
                  <TableCell>{row.patient_name}</TableCell>
                  <TableCell>{row.service_type}</TableCell>
                  <TableCell className="text-right">{fmt(row.cost)}</TableCell>
                  <TableCell>{row.payment_method ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.amount_collected ? fmt(row.amount_collected) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-right text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
          {filtered.length > 0 && <> · Total cobrado: <strong>{fmt(totalCobrado)}</strong></>}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} registro</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Fecha *</Label>
              <Input type="date" value={form.record_date} onChange={e => setForm({ ...form, record_date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Nombre del médico tratante *</Label>
              <Select value={(!form.specialist_id || form.specialist_id === "__unset__") ? "__unset__" : form.specialist_id} onValueChange={v => {
                if (v === "__unset__") { setForm({ ...form, specialist_id: "", specialist_name: "" }); return }
                const s = specialistList.find(sp => sp.id === v);
                setForm({ ...form, specialist_id: v, specialist_name: s?.full_name ?? v });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">— Sin asignar —</SelectItem>
                  {specialistList.map(sp => <SelectItem key={sp.id} value={sp.id}>{sp.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={form.specialist_name} onChange={e => setForm({ ...form, specialist_name: e.target.value, specialist_id: "" })} placeholder="O escribirlo manualmente..." />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Nombre del paciente *</Label>
              <Select value={selectedPatientId || "__unset__"} onValueChange={v => {
                if (v === "__unset__") { setSelectedPatientId(""); setForm({ ...form, patient_name: "" }); return }
                const p = patientList.find(pt => pt.id === v);
                setSelectedPatientId(v);
                setForm({ ...form, patient_name: p?.full_name ?? "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unset__">— Nuevo paciente —</SelectItem>
                  {patientList.map(pt => <SelectItem key={pt.id} value={pt.id}>{pt.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={form.patient_name} onChange={e => { setSelectedPatientId(""); setForm({ ...form, patient_name: e.target.value }) }} placeholder="O escribir nombre manualmente..." />
            </div>
            <div className="col-span-2">
              <Label>Servicio</Label>
              <Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Costo ($)</Label>
              <Input type="number" step="0.01" min="0" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <Label>Forma de pago</Label>
              <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total cobrado ($)</Label>
              <Input type="number" step="0.01" min="0" value={form.amount_collected} onChange={e => setForm({ ...form, amount_collected: e.target.value })} />
            </div>
            <div>
              <Label>Fecha del pago</Label>
              <Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Transferencia (Synapsia o Médico)</Label>
              <Select value={form.transfer_to} onValueChange={v => setForm({ ...form, transfer_to: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Synapsia">Synapsia</SelectItem>
                  <SelectItem value="Médico">Médico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="hasInvoice" checked={form.has_invoice} onChange={e => setForm({ ...form, has_invoice: e.target.checked })} className="h-4 w-4" />
              <Label htmlFor="hasInvoice" className="cursor-pointer">Factura</Label>
            </div>
            {form.has_invoice && <>
              <div>
                <Label>Fecha factura</Label>
                <Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} />
              </div>
              <div>
                <Label>Folio factura</Label>
                <Input value={form.invoice_folio} onChange={e => setForm({ ...form, invoice_folio: e.target.value })} />
              </div>
            </>}
            <div className="col-span-2">
              <Label>Comentarios</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
