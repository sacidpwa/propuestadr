import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, FileText, Loader2, LogOut, Pencil, Search, UserPlus } from "lucide-react";

interface Patient { id: string; full_name: string; phone: string | null; email: string | null; date_of_birth: string | null; health_unit_id: string | null; health_unit_name?: string; }
interface HealthUnit { id: string; name: string; }
interface Quote { id: string; quote_number: string; client_name: string; resident_name: string | null; service_type: string; base_monthly_price: number; }

const SYNAPSIA_NAME = "Synapsia Consultorio";

export default function Patients() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthUnits, setHealthUnits] = useState<HealthUnit[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", date_of_birth: "", notes: "", health_unit_id: "", quote_id: "" });
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", date_of_birth: "", notes: "", health_unit_id: "", quote_id: "" });

  useEffect(() => { fetchPatients(); fetchHealthUnits(); fetchQuotes(); }, []);

  const fetchPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, phone, email, date_of_birth, health_unit_id")
      .order("full_name");
    setPatients((data as any) || []);
  };

  const fetchHealthUnits = async () => {
    const { data } = await supabase.from("health_units").select("id, name").eq("is_active", true).order("name");
    setHealthUnits((data as any) || []);
  };

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, resident_name, service_type, base_monthly_price")
      .order("created_at", { ascending: false });
    setQuotes((data as any) || []);
  };

  const openEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("full_name, phone, email, date_of_birth, notes, health_unit_id, quote_id")
      .eq("id", id).single();
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    setEditId(id);
    fetchQuotes();
    setEditForm({
      full_name: data.full_name || "",
      phone: data.phone || "",
      email: data.email || "",
      date_of_birth: data.date_of_birth || "",
      notes: (data as any).notes || "",
      health_unit_id: (data as any).health_unit_id || "",
      quote_id: (data as any).quote_id || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setLoading(true);
    const { error } = await supabase.from("patients").update({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      email: editForm.email || null,
      date_of_birth: editForm.date_of_birth || null,
      notes: editForm.notes || null,
      health_unit_id: editForm.health_unit_id || null,
      quote_id: editForm.quote_id || null,
    }).eq("id", editId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Paciente actualizado" });
      setEditOpen(false);
      setEditId(null);
      fetchPatients();
    }
    setLoading(false);
  };

  const handleNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from("patients").insert({
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      date_of_birth: form.date_of_birth || null,
      notes: form.notes || null,
      health_unit_id: form.health_unit_id || null,
      quote_id: form.quote_id || null,
    }).select().single();
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Paciente registrado" });
      setOpen(false);
      setForm({ full_name: "", phone: "", email: "", date_of_birth: "", notes: "", health_unit_id: "", quote_id: "" });
      fetchPatients();
      if (data) navigate(`/synapsia/records/${data.id}`);
    }
    setLoading(false);
  };

  const isSynapsia = (huId: string) => {
    const hu = healthUnits.find(h => h.id === huId);
    return hu?.name === SYNAPSIA_NAME;
  };

  const getHealthUnitName = (huId: string | null) => {
    if (!huId) return "";
    return healthUnits.find(h => h.id === huId)?.name || "";
  };

  const selectedUnitIsSynapsia = form.health_unit_id ? isSynapsia(form.health_unit_id) : true;
  const editUnitIsSynapsia = editForm.health_unit_id ? isSynapsia(editForm.health_unit_id) : true;

  const getFilteredQuotes = (huId: string) => {
    const hu = healthUnits.find(h => h.id === huId);
    if (!hu) return [];
    const serviceMap: Record<string, string> = {
      "Centro Benesse": "centro_benesse",
      "Senior Living": "senior_living",
      "CT Alcatraces": "ct_alcatraces",
    };
    const st = serviceMap[hu.name];
    return st ? quotes.filter(q => q.service_type === st) : [];
  };

  const filtered = patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
            <div><h1 className="text-lg font-bold">Pacientes</h1><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Nuevo paciente</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Registrar paciente</DialogTitle></DialogHeader>
              <form onSubmit={handleNew} className="space-y-3">
                <div className="space-y-2"><Label>Nombre completo *</Label><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Complejo de salud</Label>
                  <Select value={form.health_unit_id} onValueChange={v => setForm({ ...form, health_unit_id: v, quote_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar complejo" /></SelectTrigger>
                    <SelectContent>
                      {healthUnits.map(hu => (
                        <SelectItem key={hu.id} value={hu.id}>{hu.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.health_unit_id && !selectedUnitIsSynapsia && (
                  <div className="space-y-2"><Label>Cotización</Label>
                    <Select value={form.quote_id} onValueChange={v => setForm({ ...form, quote_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar cotización" /></SelectTrigger>
                      <SelectContent>
                        {getFilteredQuotes(form.health_unit_id).map(q => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.quote_number} — {q.resident_name || q.client_name} (${q.base_monthly_price?.toLocaleString()})
                          </SelectItem>
                        ))}
                        {getFilteredQuotes(form.health_unit_id).length === 0 && (
                          <SelectItem value="_none" disabled>No hay cotizaciones disponibles</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.health_unit_id && selectedUnitIsSynapsia && (
                  <p className="text-xs text-muted-foreground">Paciente de consulta externa. El cobro se registra por consulta.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Fecha de nacimiento</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar y abrir expediente"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Listado</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Complejo</TableHead><TableHead>Teléfono</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin resultados</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getHealthUnitName(p.health_unit_id)}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>{p.email || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                      <Link to={`/synapsia/records/${p.id}`}><Button size="sm" variant="outline"><FileText className="w-3 h-3 mr-1" /> Expediente</Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Editar paciente</DialogTitle></DialogHeader>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="space-y-2"><Label>Nombre completo *</Label><Input required value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Teléfono</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Complejo de salud</Label>
                <Select value={editForm.health_unit_id} onValueChange={v => setEditForm({ ...editForm, health_unit_id: v, quote_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar complejo" /></SelectTrigger>
                  <SelectContent>
                    {healthUnits.map(hu => (
                      <SelectItem key={hu.id} value={hu.id}>{hu.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editForm.health_unit_id && !editUnitIsSynapsia && (
                <div className="space-y-2"><Label>Cotización</Label>
                  <Select value={editForm.quote_id} onValueChange={v => setEditForm({ ...editForm, quote_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cotización" /></SelectTrigger>
                    <SelectContent>
                      {getFilteredQuotes(editForm.health_unit_id).map(q => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.quote_number} — {q.resident_name || q.client_name} (${q.base_monthly_price?.toLocaleString()})
                        </SelectItem>
                      ))}
                      {getFilteredQuotes(editForm.health_unit_id).length === 0 && (
                        <SelectItem value="_none" disabled>No hay cotizaciones disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Fecha de nacimiento</Label><Input type="date" value={editForm.date_of_birth} onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Notas</Label><Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar cambios"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
