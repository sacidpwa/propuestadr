import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut, Save, Search, UserPlus, Pencil, Phone, Mail, Cake, MapPin, Users, ShieldAlert, DollarSign, Calendar, ExternalLink, Archive, Trash2, RefreshCw } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: string; full_name: string; phone: string | null; email: string | null;
  date_of_birth: string | null; notes: string | null; health_unit_id: string | null;
  is_active: boolean;
}

export default function RegistroPaciente() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("nuevo");
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const canReactivate = hasRole("admin") || hasRole("dueno");

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", address: "",
    tutor_name: "", tutor_phone: "", tutor_email: "", tutor_relationship: "",
    monthly_fee: "", payment_date: "", tipo_estancia: "", tipo_pago: "", paga: "",
    notes: "",
  });

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
      loadPatients();
    })();
  }, [unitId]);

  async function loadPatients() {
    if (!unitId) return;
    const { data } = await (supabase.from as any)("patients")
      .select("id, full_name, phone, email, date_of_birth, notes, health_unit_id, is_active")
      .eq("health_unit_id", unitId).order("full_name");
    setPatients((data as any) || []);
  }

  const filtered = patients.filter(p =>
    (showInactive || p.is_active !== false) &&
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setForm({ full_name: "", phone: "", email: "", date_of_birth: "", address: "", tutor_name: "", tutor_phone: "", tutor_email: "", tutor_relationship: "", monthly_fee: "", payment_date: "", tipo_estancia: "", tipo_pago: "", paga: "", notes: "" });
    setEditId(null);
  }

  async function loadPatient(id: string) {
    const { data } = await (supabase.from as any)("patients").select("*").eq("id", id).maybeSingle();
    if (!data) return;
    const p = data as any;
    let tutor_name = "", tutor_phone = "", tutor_email = "", tutor_relationship = "", address = "", monthly_fee = "", payment_date = "", tipo_estancia = "", tipo_pago = "", paga = "";
    if (p.notes) {
      try {
        const meta = JSON.parse(p.notes);
        if (meta._tutor) { tutor_name = meta._tutor.name || ""; tutor_phone = meta._tutor.phone || ""; tutor_email = meta._tutor.email || ""; tutor_relationship = meta._tutor.relationship || ""; }
        if (meta._address) address = meta._address;
        if (meta._monthly_fee) monthly_fee = meta._monthly_fee;
        if (meta._payment_date) payment_date = meta._payment_date;
        if (meta._tipo_estancia) tipo_estancia = meta._tipo_estancia;
        if (meta._tipo_pago) tipo_pago = meta._tipo_pago;
        if (meta._paga) paga = meta._paga;
      } catch {}
    }
    setForm({
      full_name: p.full_name || "",
      phone: p.phone || "",
      email: p.email || "",
      date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : "",
      address,
      tutor_name, tutor_phone, tutor_email, tutor_relationship,
      monthly_fee, payment_date, tipo_estancia, tipo_pago, paga,
      notes: p.notes || "",
    });
    setEditId(id);
    setTab("nuevo");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId || !form.full_name.trim()) {
      toast({ title: "El nombre del paciente es obligatorio", variant: "destructive" });
      return;
    }
    setSaving(true);

    const metaNotes = JSON.stringify({
      _tutor: { name: form.tutor_name, phone: form.tutor_phone, email: form.tutor_email, relationship: form.tutor_relationship },
      _address: form.address,
      _monthly_fee: form.monthly_fee,
      _payment_date: form.payment_date,
      _tipo_estancia: form.tipo_estancia,
      _tipo_pago: form.tipo_pago,
      _paga: form.paga,
      _main: form.notes,
    });

    const payload: any = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      date_of_birth: form.date_of_birth || null,
      health_unit_id: unitId,
      notes: metaNotes,
    };

    let error: any = null;
    if (editId) {
      const { error: e } = await (supabase.from as any)("patients").update(payload).eq("id", editId);
      error = e;
    } else {
      const { error: e } = await (supabase.from as any)("patients").insert(payload);
      error = e;
    }

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Paciente actualizado" : "Paciente registrado" });
      resetForm();
      loadPatients();
    }
    setSaving(false);
  }

  async function handleArchive(id: string, active: boolean) {
    if (active && !confirm("¿Reactivar este paciente?")) return;
    if (!active && !confirm("¿Archivar este paciente? Dejará de aparecer en listados activos.")) return;
    await (supabase.from as any)("patients").update({ is_active: active }).eq("id", id);
    toast({ title: active ? "Paciente reactivado" : "Paciente archivado" });
    loadPatients();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar permanentemente este paciente? Esta acción no se puede deshacer.")) return;
    await (supabase.from as any)("patients").delete().eq("id", id);
    toast({ title: "Paciente eliminado" });
    loadPatients();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Registro de pacientes — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="nuevo">
              {editId ? <Pencil className="w-4 h-4 mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
              {editId ? "Editar paciente" : "Nuevo paciente"}
            </TabsTrigger>
            <TabsTrigger value="lista"><Search className="w-4 h-4 mr-1" />Buscar paciente</TabsTrigger>
          </TabsList>

          <TabsContent value="nuevo">
            <form onSubmit={handleSave} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5" /> Datos del paciente / residente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nombre completo *</Label>
                      <Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value.toUpperCase() })} placeholder="Nombre del paciente" />
                    </div>
                    <div className="space-y-1.5">
                      <Label><Phone className="w-3 h-3 inline mr-1" />Teléfono</Label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="555-123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label><Mail className="w-3 h-3 inline mr-1" />Email</Label>
                      <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="paciente@correo.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label><Cake className="w-3 h-3 inline mr-1" />Fecha de nacimiento</Label>
                      <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label><MapPin className="w-3 h-3 inline mr-1" />Dirección</Label>
                      <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value.toUpperCase() })} placeholder="Calle, colonia, CP" />
                    </div>
                    <div className="space-y-1.5">
                      <Label><DollarSign className="w-3 h-3 inline mr-1" />Mensualidad acordada $</Label>
                      <Input type="number" min="0" step="0.01" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label><Calendar className="w-3 h-3 inline mr-1" />Día de pago (cada mes)</Label>
                      <Input type="number" min="1" max="31" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} placeholder="Ej: 5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo de estancia</Label>
                      <Select value={form.tipo_estancia} onValueChange={v => setForm({ ...form, tipo_estancia: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERMANENTE">PERMANENTE</SelectItem>
                          <SelectItem value="ESTANCIA DE DIA">ESTANCIA DE DÍA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo de pago</Label>
                      <Input value={form.tipo_pago} onChange={e => setForm({ ...form, tipo_pago: e.target.value.toUpperCase() })} placeholder="EJ: MENSUAL, QUINCENAL, SEMANAL" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Paga</Label>
                      <Input value={form.paga} onChange={e => setForm({ ...form, paga: e.target.value.toUpperCase() })} placeholder="DESCRIPCIÓN DE LO QUE PAGA" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> Tutor responsable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nombre completo</Label>
                      <Input value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value.toUpperCase() })} placeholder="Nombre del tutor" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Parentesco</Label>
                      <Select value={form.tutor_relationship} onValueChange={v => setForm({ ...form, tutor_relationship: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MADRE">MADRE</SelectItem>
                          <SelectItem value="PADRE">PADRE</SelectItem>
                          <SelectItem value="HIJO(A)">HIJO(A)</SelectItem>
                          <SelectItem value="HERMANO(A)">HERMANO(A)</SelectItem>
                          <SelectItem value="CONYUGE">CÓNYUGE</SelectItem>
                          <SelectItem value="FAMILIAR">FAMILIAR</SelectItem>
                          <SelectItem value="TUTOR LEGAL">TUTOR LEGAL</SelectItem>
                          <SelectItem value="OTRO">OTRO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Teléfono</Label>
                      <Input value={form.tutor_phone} onChange={e => setForm({ ...form, tutor_phone: e.target.value })} placeholder="555-123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={form.tutor_email} onChange={e => setForm({ ...form, tutor_email: e.target.value })} placeholder="tutor@correo.com" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notas adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value.toUpperCase() })} placeholder="ALERGIAS, CONDICIONES, OBSERVACIONES..." />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                {editId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar edición</Button>}
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : editId ? "Actualizar paciente" : "Registrar paciente"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="lista">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pacientes registrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)}
                    className="max-w-sm" />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="h-4 w-4" />
                    Mostrar inactivos
                  </label>
                </div>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No se encontraron pacientes.</p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
                        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/synapsia/unidades/${unitId}/paciente/${p.id}`)}>
                          <p className="font-medium">
                            {p.full_name}
                            {p.is_active === false && <span className="ml-2 text-xs text-muted-foreground border rounded px-1.5 py-0.5">Inactivo</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.phone && <><Phone className="w-3 h-3 inline mr-1" />{p.phone} </>}
                            {p.date_of_birth && <><Cake className="w-3 h-3 inline mr-1" />{format(new Date(p.date_of_birth), "PP", { locale: es })}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          {p.is_active === false && canReactivate && (
                            <Button variant="outline" size="sm" onClick={() => handleArchive(p.id, true)} title="Reactivar">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {p.is_active !== false && (
                            <Button variant="outline" size="sm" onClick={() => handleArchive(p.id, false)} title="Archivar">
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {canReactivate && (
                            <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive" title="Eliminar permanentemente">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
